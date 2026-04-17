import { SignalingChannel, type SignalMessage } from './signaling';

// Open Relay Project TURN servers (free 20GB/month — no signup needed at this URL)
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

export class PeerConnection {
  private pc: RTCPeerConnection;
  private signaling: SignalingChannel;
  private isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  constructor(signaling: SignalingChannel, isInitiator: boolean) {
    this.signaling = signaling;
    this.isInitiator = isInitiator;

    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.signaling.send({ type: 'ice', candidate: candidate.toJSON() });
      }
    };

    this.pc.ontrack = (event) => {
      this.onRemoteStream?.(event.streams[0]);
    };

    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.pc.connectionState);
    };
  }

  addLocalStream(stream: MediaStream) {
    stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
  }

  async handleSignal(msg: SignalMessage) {
    if (msg.type === 'offer') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.signaling.send({ type: 'answer', sdp: answer });
    } else if (msg.type === 'answer') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else if (msg.type === 'ice') {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) { console.warn('ICE candidate error', e); }
    }
  }

  async startCall() {
    if (!this.isInitiator) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.signaling.send({ type: 'offer', sdp: offer });
  }

  async close() {
    this.pc.close();
  }

  get connectionState() {
    return this.pc.connectionState;
  }
}
