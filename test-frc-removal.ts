import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testFRCRemoval() {
  console.log('=== Testing FRC Removed Lines Calculation ===\n');

  // Get assessment
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, assessment_no, estimate_id')
    .eq('assessment_no', 'ASM-2025-017')
    .single();

  console.log('Assessment:', assessment?.assessment_no);

  // Check current FRC
  const { data: frc } = await supabase
    .from('assessment_frc')
    .select('id, line_items_version, line_items')
    .eq('assessment_id', assessment!.id)
    .maybeSingle();

  console.log('Current FRC exists:', !!frc);
  console.log('FRC line count:', frc?.line_items?.length || 0);

  // Check additionals
  const { data: additionals } = await supabase
    .from('assessment_additionals')
    .select('line_items')
    .eq('assessment_id', assessment!.id)
    .single();

  console.log('Additionals line count:', additionals?.line_items?.length || 0);

  if (additionals?.line_items && additionals.line_items.length > 0) {
    const removals = additionals.line_items.filter((l: any) => l.action === 'removed');
    console.log('Removal lines in additionals:', removals.length);

    if (removals.length > 0) {
      console.log('\nFirst removal line:');
      console.log('  Original Line ID:', removals[0].original_line_id);
      console.log('  Description:', removals[0].description);
      console.log('  Part Price (nett):', removals[0].part_price_nett);
      console.log('  Total:', removals[0].total);
    }
  }

  // If FRC exists, analyze the lines
  if (frc?.line_items) {
    console.log('\n=== FRC Lines Analysis ===');

    const originalLines = frc.line_items.filter((l: any) => l.source === 'estimate');
    const additionalLines = frc.line_items.filter((l: any) => l.source === 'additional');
    const removalLines = additionalLines.filter((l: any) => (l.quoted_total || 0) < 0);

    console.log('Original estimate lines:', originalLines.length);
    console.log('Additional lines:', additionalLines.length);
    console.log('Removal lines (negative):', removalLines.length);

    if (removalLines.length > 0) {
      console.log('\nRemoval line details:');
      removalLines.forEach((line: any, idx: number) => {
        console.log(`  ${idx + 1}. ${line.description}`);
        console.log(`     Total: ${line.quoted_total}`);
        console.log(`     Source Line ID: ${line.source_line_id}`);
      });
    }

    // Check for corresponding removed original lines
    const removedOriginals = originalLines.filter((l: any) => l.removed_via_additionals);
    console.log('\nOriginal lines marked as removed:', removedOriginals.length);

    if (removedOriginals.length > 0) {
      console.log('Removed original line details:');
      removedOriginals.forEach((line: any, idx: number) => {
        console.log(`  ${idx + 1}. ${line.description}`);
        console.log(`     Total: ${line.quoted_total}`);
        console.log(`     Line ID: ${line.id}`);
      });
    }

    // Calculate totals
    const estimateTotal = originalLines.reduce((sum: number, l: any) => sum + (l.quoted_total || 0), 0);
    const additionalsTotal = additionalLines.reduce((sum: number, l: any) => sum + (l.quoted_total || 0), 0);
    const combinedTotal = estimateTotal + additionalsTotal;

    console.log('\n=== Totals ===');
    console.log('Estimate lines total: R', estimateTotal.toFixed(2));
    console.log('Additional lines total: R', additionalsTotal.toFixed(2));
    console.log('Combined total: R', combinedTotal.toFixed(2));

    // If we have both removed original and removal line, verify net zero
    if (removedOriginals.length > 0 && removalLines.length > 0) {
      console.log('\n=== Net Zero Verification ===');
      removedOriginals.forEach((orig: any) => {
        const removal = removalLines.find((r: any) => r.source_line_id === orig.source_line_id);
        if (removal) {
          const net = (orig.quoted_total || 0) + (removal.quoted_total || 0);
          console.log(`Line: ${orig.description}`);
          console.log(`  Original: +R${(orig.quoted_total || 0).toFixed(2)}`);
          console.log(`  Removal: R${(removal.quoted_total || 0).toFixed(2)}`);
          console.log(`  Net: R${net.toFixed(2)} ${net === 0 ? '✓ CORRECT' : '✗ ERROR'}`);
        }
      });
    }
  }
}

testFRCRemoval().catch(console.error);
