targetScope = 'subscription'

// Parameters
param location string = 'centralindia'
param resourceGroupName string = 'preploop-backend'
param appServicePlanName string = 'preploop-backend-plan'
param webAppName string = 'preploop-api-staging'
param environment string = 'staging'

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

// Outputs
output resourceGroupId string = rg.id
output resourceGroupName string = rg.name
output appServicePlanId string = appService.outputs.appServicePlanId
output webAppId string = appService.outputs.webAppId
output webAppUrl string = appService.outputs.webAppUrl
