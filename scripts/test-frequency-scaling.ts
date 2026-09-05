import {
  computeTopicFrequencyScale,
  computeSubtopicFrequencyScale,
} from '../src/utils/interestTreeScaling';

function runFrequencyVisualTests() {
  console.log('=== Running Frequency Scaling Verification ===\n');

  // Test 1: Single topic baseline
  const singleTopic = computeTopicFrequencyScale(1, 1, 1);
  console.log('1. Single topic (freq 1):', {
    tier: singleTopic.tier,
    nodeWidth: singleTopic.nodeWidth,
    strokeWidth: singleTopic.strokeWidth,
  });
  if (singleTopic.nodeWidth < 180 || singleTopic.nodeWidth > 255) {
    throw new Error('Single topic width out of bounds');
  }

  // Test 2: Highly uneven frequencies (1 vs 100)
  const quietTopic = computeTopicFrequencyScale(1, 1, 100);
  const prominentTopic = computeTopicFrequencyScale(100, 1, 100);
  console.log('2. Uneven frequencies (1 vs 100):');
  console.log('   Quiet (freq 1):', {
    tier: quietTopic.tier,
    nodeWidth: quietTopic.nodeWidth,
    strokeWidth: quietTopic.strokeWidth,
  });
  console.log('   Prominent (freq 100):', {
    tier: prominentTopic.tier,
    nodeWidth: prominentTopic.nodeWidth,
    strokeWidth: prominentTopic.strokeWidth,
  });

  if (quietTopic.nodeWidth >= prominentTopic.nodeWidth) {
    throw new Error('Prominent topic must be strictly wider than quiet topic');
  }
  if (prominentTopic.nodeWidth > 255) {
    throw new Error(`Prominent topic width exceeds upper limit 255px: ${prominentTopic.nodeWidth}`);
  }
  if (quietTopic.nodeWidth < 180) {
    throw new Error(`Quiet topic width is smaller than 180px: ${quietTopic.nodeWidth}`);
  }
  if (prominentTopic.strokeWidth <= quietTopic.strokeWidth) {
    throw new Error('Prominent edge stroke must be thicker than quiet edge');
  }

  // Test 3: Conceptual tiers (1 -> small, 2-3 -> medium, 4-7 -> large, 8+ -> very prominent)
  const f1 = computeTopicFrequencyScale(1, 1, 12);
  const f2 = computeTopicFrequencyScale(2, 1, 12);
  const f5 = computeTopicFrequencyScale(5, 1, 12);
  const f12 = computeTopicFrequencyScale(12, 1, 12);

  console.log('3. Smooth scaling tiers:');
  console.log(`   Freq 1  -> ${f1.tier} (${f1.nodeWidth}px)`);
  console.log(`   Freq 2  -> ${f2.tier} (${f2.nodeWidth}px)`);
  console.log(`   Freq 5  -> ${f5.tier} (${f5.nodeWidth}px)`);
  console.log(`   Freq 12 -> ${f12.tier} (${f12.nodeWidth}px)`);

  if (!(f1.nodeWidth <= f2.nodeWidth && f2.nodeWidth <= f5.nodeWidth && f5.nodeWidth <= f12.nodeWidth)) {
    throw new Error('Node widths must monotonically increase with frequency');
  }

  // Test 4: Subtopic nodes must remain strictly smaller than parent topics
  const maxSubFreq = 10;
  const sub1 = computeSubtopicFrequencyScale(1, maxSubFreq);
  const sub10 = computeSubtopicFrequencyScale(10, maxSubFreq);

  console.log('4. Subtopic scaling:');
  console.log(`   Subtopic Freq 1  -> ${sub1.nodeWidth}px`);
  console.log(`   Subtopic Freq 10 -> ${sub10.nodeWidth}px`);

  if (sub10.nodeWidth >= f1.nodeWidth) {
    throw new Error(`Subtopic width (${sub10.nodeWidth}px) must be smaller than baseline parent topic (${f1.nodeWidth}px)`);
  }
  if (sub1.nodeWidth < 135 || sub10.nodeWidth > 165) {
    throw new Error('Subtopic widths must stay within 135-165px bounds');
  }

  console.log('\n=== ALL FREQUENCY VISUALIZATION TESTS PASSED ===');
}

runFrequencyVisualTests();
