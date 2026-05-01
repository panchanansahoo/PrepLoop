targetScope = 'subscription'

// Parameters
param location string = 'centralindia'
param resourceGroupName string = 'preploop-backend'
param appServicePlanName string = 'preploop-backend-plan'
param webAppName string = 'preploop-api-staging'
param environment string = 'staging'
param logAnalyticsWorkspaceName string = 'preploop-law'
param monitorWorkspaceName string = 'preploop-amw'
param grafanaName string = 'preploop-grafana'
param appInsightsName string = 'preploop-ai'
param alertEmail string = ''

// Variables
var tags = {
  environment: environment
  project: 'preploop'
  createdBy: 'azd'
}

// Create resource group
resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Deploy App Service resources
module appService 'appService.bicep' = {
  name: 'appService-deployment'
  scope: rg
  params: {
    location: location
    appServicePlanName: appServicePlanName
    webAppName: webAppName
    environment: environment
    tags: tags
  }
}

module monitoring 'monitoring.bicep' = {
  name: 'monitoring-deployment'
  scope: rg
  params: {
    location: location
    tags: tags
    webAppName: webAppName
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    monitorWorkspaceName: monitorWorkspaceName
    grafanaName: grafanaName
    appInsightsName: appInsightsName
    actionGroupEmail: alertEmail
  }
}

// Outputs
output resourceGroupId string = rg.id
output resourceGroupName string = rg.name
output appServicePlanId string = appService.outputs.appServicePlanId
output webAppId string = appService.outputs.webAppId
output webAppUrl string = appService.outputs.webAppUrl
output logAnalyticsWorkspaceId string = monitoring.outputs.logAnalyticsWorkspaceId
output monitorWorkspaceId string = monitoring.outputs.monitorWorkspaceId
output grafanaId string = monitoring.outputs.grafanaId
output grafanaUrl string = monitoring.outputs.grafanaUrl
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString
