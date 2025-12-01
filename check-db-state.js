import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseState() {
  console.log('🔍 Checking database state for assessment-centric refactor...\n');

  // 1. Check requests without assessments
  console.log('1️⃣ Checking for requests without assessments...');
  const { data: requestsWithoutAssessments, error: reqError } = await supabase
    .from('requests')
    .select('id, request_number, status, created_at')
    .is('id', null)
    .limit(10);

  // Better query - left join and filter nulls
  const { data: allRequests } = await supabase
    .from('requests')
    .select('id, request_number, status, created_at')
    .order('created_at', { ascending: false });

  const { data: allAssessments } = await supabase
    .from('assessments')
    .select('id, assessment_number, request_id, stage, appointment_id, inspection_id, status');

  const requestIds = new Set(allRequests?.map(r => r.id) || []);
  const assessmentRequestIds = new Set(allAssessments?.map(a => a.request_id) || []);
  
  const orphanedRequests = allRequests?.filter(r => !assessmentRequestIds.has(r.id)) || [];
  
  console.log(`   Total requests: ${allRequests?.length || 0}`);
  console.log(`   Total assessments: ${allAssessments?.length || 0}`);
  console.log(`   ⚠️  Requests without assessments: ${orphanedRequests.length}`);
  
  if (orphanedRequests.length > 0) {
    console.log('   First 5 orphaned requests:');
    orphanedRequests.slice(0, 5).forEach(r => {
      console.log(`      - ${r.request_number} (${r.status}) - ${r.created_at}`);
    });
  }
  console.log('');

  // 2. Check assessments without appointment_id (should be ok - nullable now)
  console.log('2️⃣ Checking assessments without appointment_id...');
  const assessmentsWithoutAppointment = allAssessments?.filter(a => !a.appointment_id) || [];
  console.log(`   Assessments without appointment_id: ${assessmentsWithoutAppointment.length}`);
  if (assessmentsWithoutAppointment.length > 0) {
    console.log('   First 5:');
    assessmentsWithoutAppointment.slice(0, 5).forEach(a => {
      console.log(`      - ${a.assessment_number} (stage: ${a.stage || 'NULL'}, status: ${a.status})`);
    });
  }
  console.log('');

  // 3. Check if stage field exists and is populated
  console.log('3️⃣ Checking stage field population...');
  const assessmentsWithoutStage = allAssessments?.filter(a => !a.stage) || [];
  console.log(`   ⚠️  Assessments without stage: ${assessmentsWithoutStage.length}`);
  if (assessmentsWithoutStage.length > 0) {
    console.log('   First 5:');
    assessmentsWithoutStage.slice(0, 5).forEach(a => {
      console.log(`      - ${a.assessment_number} (status: ${a.status})`);
    });
  }
  
  // Stage distribution
  const stageDistribution = {};
  allAssessments?.forEach(a => {
    const stage = a.stage || 'NULL';
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
  });
  console.log('   Stage distribution:');
  Object.entries(stageDistribution).forEach(([stage, count]) => {
    console.log(`      - ${stage}: ${count}`);
  });
  console.log('');

  // 4. Check for duplicate request_id in assessments (violates unique constraint)
  console.log('4️⃣ Checking for duplicate request_id in assessments...');
  const requestIdCounts = {};
  allAssessments?.forEach(a => {
    if (a.request_id) {
      requestIdCounts[a.request_id] = (requestIdCounts[a.request_id] || 0) + 1;
    }
  });
  const duplicates = Object.entries(requestIdCounts).filter(([_, count]) => count > 1);
  console.log(`   ⚠️  Duplicate request_ids: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('   Duplicates:');
    duplicates.forEach(([requestId, count]) => {
      const assessments = allAssessments?.filter(a => a.request_id === requestId);
      console.log(`      - Request ${requestId}: ${count} assessments`);
      assessments?.forEach(a => {
        console.log(`         * ${a.assessment_number} (stage: ${a.stage}, status: ${a.status})`);
      });
    });
  }
  console.log('');

  // 5. Check child records that might cause issues
  console.log('5️⃣ Checking child records for potential duplicates...');
  
  // Check tyres
  const { data: tyres } = await supabase
    .from('assessment_tyres')
    .select('assessment_id, position');
  
  const tyresByAssessment = {};
  tyres?.forEach(t => {
    const key = `${t.assessment_id}-${t.position}`;
    tyresByAssessment[key] = (tyresByAssessment[key] || 0) + 1;
  });
  const duplicateTyres = Object.entries(tyresByAssessment).filter(([_, count]) => count > 1);
  console.log(`   ⚠️  Duplicate tyres (assessment_id + position): ${duplicateTyres.length}`);
  
  // Check damage records
  const { data: damage } = await supabase
    .from('assessment_damage')
    .select('assessment_id');
  
  const damageByAssessment = {};
  damage?.forEach(d => {
    damageByAssessment[d.assessment_id] = (damageByAssessment[d.assessment_id] || 0) + 1;
  });
  const duplicateDamage = Object.entries(damageByAssessment).filter(([_, count]) => count > 1);
  console.log(`   ⚠️  Duplicate damage records per assessment: ${duplicateDamage.length}`);
  
  // Check estimates
  const { data: estimates } = await supabase
    .from('assessment_estimates')
    .select('assessment_id');
  
  const estimatesByAssessment = {};
  estimates?.forEach(e => {
    estimatesByAssessment[e.assessment_id] = (estimatesByAssessment[e.assessment_id] || 0) + 1;
  });
  const duplicateEstimates = Object.entries(estimatesByAssessment).filter(([_, count]) => count > 1);
  console.log(`   ⚠️  Duplicate estimates per assessment: ${duplicateEstimates.length}`);
  
  // Check vehicle values
  const { data: vehicleValues } = await supabase
    .from('assessment_vehicle_values')
    .select('assessment_id');
  
  const vehicleValuesByAssessment = {};
  vehicleValues?.forEach(v => {
    vehicleValuesByAssessment[v.assessment_id] = (vehicleValuesByAssessment[v.assessment_id] || 0) + 1;
  });
  const duplicateVehicleValues = Object.entries(vehicleValuesByAssessment).filter(([_, count]) => count > 1);
  console.log(`   ⚠️  Duplicate vehicle values per assessment: ${duplicateVehicleValues.length}`);
  
  console.log('');

  // 6. Summary
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const issues = [];
  
  if (orphanedRequests.length > 0) {
    issues.push(`❌ ${orphanedRequests.length} requests without assessments - WILL BREAK NEW MODEL`);
  }
  
  if (assessmentsWithoutStage.length > 0) {
    issues.push(`⚠️  ${assessmentsWithoutStage.length} assessments without stage field - migration may not have run`);
  }
  
  if (duplicates.length > 0) {
    issues.push(`❌ ${duplicates.length} duplicate request_ids in assessments - VIOLATES UNIQUE CONSTRAINT`);
  }
  
  if (duplicateTyres.length > 0) {
    issues.push(`⚠️  ${duplicateTyres.length} duplicate tyres - will cause issues with idempotent creation`);
  }
  
  if (duplicateDamage.length > 0) {
    issues.push(`⚠️  ${duplicateDamage.length} duplicate damage records - violates unique constraint`);
  }
  
  if (duplicateEstimates.length > 0) {
    issues.push(`⚠️  ${duplicateEstimates.length} duplicate estimates - violates unique constraint`);
  }
  
  if (duplicateVehicleValues.length > 0) {
    issues.push(`⚠️  ${duplicateVehicleValues.length} duplicate vehicle values - may cause issues`);
  }
  
  if (issues.length === 0) {
    console.log('✅ No critical issues found!');
    console.log(`✅ ${assessmentsWithoutAppointment.length} assessments without appointment_id (OK - nullable)`);
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  console.log('='.repeat(60));
}

checkDatabaseState().catch(console.error);

