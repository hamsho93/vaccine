#!/usr/bin/env tsx
/*
  Quick API test script
  Usage:
    tsx test-api.ts --url https://your-api-endpoint.com
    or set API_URL environment variable
*/

import fetch from 'node-fetch';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function getBaseUrl(): string {
  const url = getArg('url') || process.env.API_URL;
  if (!url) {
    console.error('❌ Error: No API URL provided');
    console.error('Usage: tsx test-api.ts --url https://your-api-endpoint.com');
    console.error('   or: API_URL=https://your-api-endpoint.com tsx test-api.ts');
    process.exit(1);
  }
  return url.replace(/\/$/, '');
}

async function testHealth(baseUrl: string) {
  console.log('🏥 Testing health endpoint...');
  const url = `${baseUrl}/api/health`;
  console.log(`   GET ${url}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('✅ Health check passed:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testVaccineParsing(baseUrl: string) {
  console.log('\n💉 Testing vaccine parsing endpoint...');
  const url = `${baseUrl}/api/parse-vaccine-history`;
  console.log(`   POST ${url}`);
  
  const testData = {
    vaccineData: 'DTaP administered on 2021-01-15 at age 2 months\nMMR given 2022-07-20 at 18 months',
    birthDate: '2020-11-15'
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });
    
    const responseText = await res.text();
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} ${res.statusText}`);
      console.error('Response:', responseText);
      return false;
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Vaccine parsing succeeded!');
    console.log('   Vaccines found:', data.vaccines?.length || 0);
    console.log('   Patient info:', data.patientInfo);
    console.log('\nFull response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Vaccine parsing failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testVaccineCatchup(baseUrl: string) {
  console.log('\n📋 Testing vaccine catch-up endpoint...');
  const url = `${baseUrl}/api/vaccine-catchup`;
  console.log(`   POST ${url}`);
  
  const testData = {
    birthDate: '2020-11-15',
    currentDate: new Date().toISOString().slice(0, 10),
    vaccineHistory: [
      {
        vaccineName: 'DTaP',
        doses: [{ date: '2021-01-15' }]
      }
    ],
    specialConditions: {}
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });
    
    const responseText = await res.text();
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} ${res.statusText}`);
      console.error('Response:', responseText);
      return false;
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Vaccine catch-up succeeded!');
    console.log('   Recommendations:', data.recommendations?.length || 0);
    console.log('\nSample recommendation:', JSON.stringify(data.recommendations?.[0], null, 2));
    return true;
  } catch (error) {
    console.error('❌ Vaccine catch-up failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log('🚀 VaxRecord API Test\n');
  
  const baseUrl = getBaseUrl();
  console.log(`🌐 API Base URL: ${baseUrl}\n`);
  
  const healthOk = await testHealth(baseUrl);
  
  if (!healthOk) {
    console.log('\n⚠️  Health check failed. Skipping other tests.');
    console.log('💡 Make sure:');
    console.log('   1. The API is deployed and accessible');
    console.log('   2. The URL is correct');
    console.log('   3. CORS is properly configured');
    process.exit(1);
  }
  
  const parseOk = await testVaccineParsing(baseUrl);
  
  if (!parseOk) {
    console.log('\n⚠️  Vaccine parsing failed.');
    console.log('💡 Check:');
    console.log('   1. AWS Bedrock model access is enabled (Claude 3.5 Sonnet)');
    console.log('   2. Lambda has proper IAM permissions for bedrock:InvokeModel');
    console.log('   3. Check CloudWatch logs for detailed errors');
  }
  
  const catchupOk = await testVaccineCatchup(baseUrl);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   Health:   ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Parsing:  ${parseOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Catch-up: ${catchupOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));
  
  if (healthOk && parseOk && catchupOk) {
    console.log('\n🎉 All tests PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
