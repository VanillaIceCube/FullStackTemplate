[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Owner,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Repository,

    [string]$ProjectTitle = "$Repository Project"
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI (gh) is required. Install it and run gh auth login first.'
}

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'GitHub CLI is not authenticated. Run gh auth login, then gh auth refresh -s project.'
}

function Invoke-GitHubGraphQL {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Query,

        [Parameter(Mandatory = $true)]
        [hashtable]$Variables
    )

    $payload = @{
        query = $Query
        variables = $Variables
    } | ConvertTo-Json -Depth 20 -Compress

    $rawResponse = $payload | gh api graphql --input -
    if ($LASTEXITCODE -ne 0) {
        throw 'A GitHub GraphQL request failed.'
    }

    return $rawResponse | ConvertFrom-Json
}

$identityQuery = @'
query($owner: String!, $repository: String!) {
  repository(owner: $owner, name: $repository) { id }
  organization(login: $owner) { id }
  user(login: $owner) { id }
}
'@

$identity = Invoke-GitHubGraphQL -Query $identityQuery -Variables @{
    owner = $Owner
    repository = $Repository
}

if (-not $identity.data.repository.id) {
    throw "Could not resolve $Owner/$Repository."
}

$ownerId = if ($identity.data.organization.id) {
    $identity.data.organization.id
} else {
    $identity.data.user.id
}

if (-not $ownerId) {
    throw "Could not resolve project owner $Owner."
}

$createProjectMutation = @'
mutation($ownerId: ID!, $repositoryId: ID!, $title: String!) {
  createProjectV2(input: {
    ownerId: $ownerId,
    repositoryId: $repositoryId,
    title: $title
  }) {
    projectV2 { id number url }
  }
}
'@

$projectResponse = Invoke-GitHubGraphQL -Query $createProjectMutation -Variables @{
    ownerId = $ownerId
    repositoryId = $identity.data.repository.id
    title = $ProjectTitle
}

if (-not $projectResponse.data.createProjectV2.projectV2.id) {
    throw 'GitHub did not return a new Project ID.'
}

$project = $projectResponse.data.createProjectV2.projectV2
$createFieldMutation = @'
mutation(
  $projectId: ID!,
  $name: String!,
  $dataType: ProjectV2CustomFieldType!,
  $options: [ProjectV2SingleSelectFieldOptionInput!]
) {
  createProjectV2Field(input: {
    projectId: $projectId,
    name: $name,
    dataType: $dataType,
    singleSelectOptions: $options
  }) {
    projectV2Field { __typename }
  }
}
'@

function New-SingleSelectField {
    param(
        [string]$Name,
        [string[]]$Options
    )

    $colors = @('GRAY', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'RED', 'PURPLE', 'PINK')
    $optionObjects = for ($index = 0; $index -lt $Options.Count; $index++) {
        @{
            name = $Options[$index]
            description = ''
            color = $colors[$index % $colors.Count]
        }
    }
    Invoke-GitHubGraphQL -Query $createFieldMutation -Variables @{
        projectId = $project.id
        name = $Name
        dataType = 'SINGLE_SELECT'
        options = @($optionObjects)
    } | Out-Null
}

New-SingleSelectField -Name 'Domain' -Options @('Frontend', 'Backend', 'CI/CD', 'Infrastructure', 'Product')
New-SingleSelectField -Name 'Type' -Options @('Feature', 'Bug', 'Chore', 'Security', 'Documentation')
New-SingleSelectField -Name 'Priority' -Options @('P0', 'P1', 'P2', 'P3')
New-SingleSelectField -Name 'Size' -Options @('XS', 'S', 'M', 'L', 'XL')

foreach ($field in @(
    @{ Name = 'Estimate'; Type = 'NUMBER' },
    @{ Name = 'Start date'; Type = 'DATE' },
    @{ Name = 'End date'; Type = 'DATE' }
)) {
    Invoke-GitHubGraphQL -Query $createFieldMutation -Variables @{
        projectId = $project.id
        name = $field.Name
        dataType = $field.Type
        options = $null
    } | Out-Null
}

Write-Output "Created $($project.url)"
Write-Output "Set repository variable SECURITY_ALERTS_PROJECT_ID to $($project.id)"
Write-Output 'In the Project UI, change Status options to Backlog, Ready, In Progress, In Review, and Done.'
Write-Output 'Then create the views and built-in workflows listed in docs/GITHUB_SETUP.md.'
