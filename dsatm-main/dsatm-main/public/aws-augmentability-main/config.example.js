// Copy this file to config.js and fill in your AWS values.
// 1. In AWS CloudFormation, deploy template.yml (Region: ap-southeast-2 for Sydney).
// 2. After the stack completes, copy the Outputs: IdentityPoolId, UserPoolId, UserWebClientId, Region.
// 3. Replace the placeholders below. OAuth domain = UserWebClientId + '.auth.' + Region + '.amazoncognito.com'

var amplifyConfig = {
  Auth: {
    region: 'ap-southeast-2',
    userPoolId: 'ap-southeast-2_XXXXXXXXX',
    userPoolWebClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    oauth: {
      domain: 'xxxxxxxxxx.auth.ap-southeast-2.amazoncognito.com',
      scope: ['email', 'openid'],
      redirectSignIn: 'http://localhost:8000/aws-augmentability-main/index-landing.html',
      redirectSignOut: 'http://localhost:8000/aws-augmentability-main/login.html',
      responseType: 'code'
    }
  }
};

var appConfig = {
  IdentityPoolId: 'ap-southeast-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
};
