// Parameters
param location string
param appServicePlanName string
param webAppName string
param environment string
param tags object

// Create App Service Plan (Linux, B1 tier)
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true
  }
  tags: tags
}

// Create Web App
resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
  }
  tags: tags
}

// Configure Web App - Linux runtime and startup command
resource webAppConfig 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'web'
  properties: {
    linuxFxVersion: 'NODE|20-lts'
    appCommandLine: 'npm start'
    alwaysOn: false
    http20Enabled: true
    minTlsVersion: '1.2'
    ftpsState: 'FtpsOnly'
    nodeVersion: ''
    use32BitWorkerProcess: true
    detailedErrorLoggingEnabled: true
    requestTracingEnabled: true
  }
}

// App Settings - Environment variables
resource webAppSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    NODE_ENV: environment == 'production' ? 'production' : 'staging'
    WEBSITE_NODE_DEFAULT_VERSION: '~20'
    SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
    // These will be set from Azure Key Vault references or GitHub Actions secrets
    SUPABASE_URL: ''
    SUPABASE_ANON_KEY: ''
    SUPABASE_SERVICE_ROLE_KEY: ''
    SUPABASE_DB_PASSWORD: ''
    JWT_SECRET: ''
    FRONTEND_URL: ''
    GROQ_API_KEY: ''
    RAZORPAY_KEY_ID: ''
    RAZORPAY_KEY_SECRET: ''
    RAZORPAY_WEBHOOK_SECRET: ''
    DEEPGRAM_API_KEY: ''
    SMTP_HOST: ''
    SMTP_PORT: ''
    SMTP_USER: ''
    SMTP_PASS: ''
    RAPIDAPI_KEY: ''
    ADZUNA_APP_ID: ''
    ADZUNA_APP_KEY: ''
    USE_REDIS: ''
    REDIS_URL: ''
    RECAPTCHA_SECRET_KEY: ''
  }
}

// Outputs
output appServicePlanId string = appServicePlan.id
output webAppId string = webApp.id
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
