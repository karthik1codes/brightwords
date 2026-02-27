# Super Power (AWS AugmentAbility) - Setup

Use **Asia Pacific (Sydney)** in AWS so it matches your account. Your AWS credits apply to these services.

## Step 1: Deploy the Cognito stack in AWS

1. Open **AWS CloudFormation** in Sydney: AWS Console -> CloudFormation, region **ap-southeast-2**.
2. **Create stack** -> **With new resources**.
3. **Template**: Upload `template.yml` from this folder.
4. **Parameters**:
   - **Region**: `ap-southeast-2` (Asia Pacific Sydney)
   - **Username**: e.g. `brightwords-user`
   - **Email**: Your email (temporary password will be sent here)
5. Create the stack. Wait until status is **CREATE_COMPLETE**.

## Step 2: Get the stack outputs

In CloudFormation -> your stack -> **Outputs** tab, note:

- **IdentityPoolId**
- **UserPoolId**
- **UserWebClientId**
- **Region**

The Cognito **domain** for OAuth is: `UserWebClientId.auth.Region.amazoncognito.com`

## Step 3: Create config.js

**Option A - Generator script (recommended)**  
From this folder run:
```bash
node create-config.js
```
Enter the Identity Pool ID, User Pool ID, User Web Client ID, and region when prompted. It will create `config.js`.

**Option B - Manual**  
1. Copy `config.example.js` to `config.js`.
2. In `config.js` replace placeholders with your stack Outputs. Set `oauth.domain` to `UserWebClientId.auth.Region.amazoncognito.com`.

## Step 4: First sign-in

1. Check the email you used in the stack; AWS sends a **temporary password**.
2. Start BrightWords, open **Super Power**, then e.g. **Text-to-Speech (Polly)**.
3. When prompted to sign in, use the Cognito Hosted UI with your **Username** and **temporary password**. Set a new password when asked.
4. After sign-in, Polly and other Super Power features should work.

## Troubleshooting

- **AWS credentials not available**: `config.js` is missing or has wrong IDs. Re-check Step 2 and Step 3.
- **Redirect error**: Ensure callback URLs in Cognito match your app (localhost:8000 or 8001). The template includes common localhost URLs.
- Keep **region** consistent: use **ap-southeast-2** in the stack and in `config.js`.
