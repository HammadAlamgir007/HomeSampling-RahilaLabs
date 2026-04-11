#!/bin/bash
set -e

echo "Building Next.js application..."
NEXT_PUBLIC_API_URL=https://rahila-labs-api.azurewebsites.net npm run build

echo "Packaging standalone files..."
cp -r public .next/standalone/ || true
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

echo "Updating package.json..."
node -e "const fs=require('fs'); let p=require('./.next/standalone/package.json'); delete p.dependencies; delete p.devDependencies; p.scripts={'start':'node server.js'}; fs.writeFileSync('./.next/standalone/package.json',JSON.stringify(p,null,2))"

echo "Zipping artifact..."
cd .next/standalone
zip -r ../../frontend-release.zip .
cd ../..

echo "Deploying to Azure..."
az webapp deploy --name rahila-labs-web --resource-group rahila-labs-rg --src-path frontend-release.zip
echo "Deployment complete."
