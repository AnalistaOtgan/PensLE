import { describe, expect, it } from 'vitest';
import { describeVoiceRecorderError } from './audioService';

describe('describeVoiceRecorderError', () => {
  it('turns native missing permission into a clear microphone permission message', () => {
    expect(describeVoiceRecorderError('MISSING_PERMISSION')).toContain('Permissão de microfone negada');
  });

  it('turns microphone-in-use into a useful message', () => {
    expect(describeVoiceRecorderError('MICROPHONE_BEING_USED')).toContain('microfone está sendo usado');
  });
});
