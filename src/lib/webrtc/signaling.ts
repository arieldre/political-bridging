import type { SupabaseClient } from '@supabase/supabase-js';

export type SignalMessage =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit; from: string }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit; from: string }
  | { type: 'ice'; candidate: RTCIceCandidateInit; from: string }
  | { type: 'ready'; from: string }
  | { type: 'end_call'; from: string };

// Outbound messages before `from` is attached by send()
export type OutboundSignal =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; candidate: RTCIceCandidateInit }
  | { type: 'ready' }
  | { type: 'end_call' };

export class SignalingChannel {
  private channel;
  private matchId: string;
  private userId: string;
  private onMessage: (msg: SignalMessage) => void;

  constructor(
    supabase: SupabaseClient,
    matchId: string,
    userId: string,
    onMessage: (msg: SignalMessage) => void
  ) {
    this.matchId = matchId;
    this.userId = userId;
    this.onMessage = onMessage;
    this.channel = supabase.channel(`call:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.from !== userId) {
          this.onMessage(payload as SignalMessage);
        }
      })
      .subscribe();
  }

  async send(msg: OutboundSignal) {
    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { ...msg, from: this.userId }
    });
  }

  destroy() {
    this.channel.unsubscribe();
  }
}
