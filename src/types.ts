export interface SocialProfile {
  platform: string;
  url: string;
  username: string;
  relevance: number; // 0-100
  bio?: string;
  followers?: string;
  following?: string;
  lastPosted?: string;
  isVerified?: boolean;
  activityLevel?: 'high' | 'medium' | 'low';
}

export interface NetworkScan {
  publicIp: string;
  isp: string;
  asn: string;
  org: string;
  ports: {
    port: number;
    service: string;
    status: 'open' | 'closed' | 'filtered';
  }[];
  threatLevel: 'low' | 'medium' | 'high';
}

export interface PhoneIntelligence {
  number: string;
  formattedNumber: string;
  country: string;
  location: string;
  carrier: string;
  lineType: 'Mobile' | 'Landline' | 'VoIP' | 'Premium' | 'Unknown';
  timeZone: string;
  riskScore: number; // 0-100
  riskReasoning?: string;
  technicalDetails: {
    mcc?: string;
    mnc?: string;
    ipExplanation: string;
  };
  summary: string;
  socialFootprint?: SocialProfile[];
}

export interface NFCScan {
  tagId: string;
  technology: string[];
  type: string;
  capacity: number;
  isWritable: boolean;
  rawPayload: string;
  decryptedData?: {
    owner?: string;
    objectType?: string;
    securityLevel?: string;
    lastAccessed?: string;
  };
}

export interface PublicRecord {
  name: string;
  dob: string;
  currentAddress: string;
  pastAddresses: string[];
  criminalHistory: {
    incident: string;
    date: string;
    location: string;
    status: string;
  }[];
  riskLevel: 'clear' | 'elevated' | 'high';
  summary: string;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  type: 'Mobile' | 'Workstation' | 'IoT' | 'Router' | 'Server';
  status: 'online' | 'blocked';
  signalStrength?: number;
}

export type ViewState = 'home' | 'report' | 'network' | 'social' | 'history' | 'nfc' | 'records' | 'camera';
