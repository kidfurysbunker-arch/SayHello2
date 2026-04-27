import { GoogleGenAI, Type } from "@google/genai";
import { PhoneIntelligence, SocialProfile, NetworkScan, NFCScan, PublicRecord, NetworkDevice } from "../types";
import { Network } from "@capacitor/network";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzePhoneNumber(phoneNumber: string): Promise<PhoneIntelligence> {
  // ... (rest of search phone remains similar, but using real context if available)
  const prompt = `Analyze phone: ${phoneNumber}. 
  Provide detailed OSINT intelligence: country, location, carrier, line type, time zone, risk.
  Also, find potential SOCIAL MEDIA footprints associated with this digital identity (names, typical handles).
  For each social profile, try to infer bio, follower count, activity level, and last post date.
  Explain why IP addresses for numbers are carrier-managed gateways.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING },
          formattedNumber: { type: Type.STRING },
          country: { type: Type.STRING },
          location: { type: Type.STRING },
          carrier: { type: Type.STRING },
          lineType: { type: Type.STRING },
          timeZone: { type: Type.STRING },
          riskScore: { type: Type.NUMBER },
          technicalDetails: {
            type: Type.OBJECT,
            properties: {
              ipExplanation: { type: Type.STRING },
              mcc: { type: Type.STRING },
              mnc: { type: Type.STRING }
            }
          },
          summary: { type: Type.STRING },
          socialFootprint: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                url: { type: Type.STRING },
                username: { type: Type.STRING },
                relevance: { type: Type.NUMBER },
                bio: { type: Type.STRING },
                followers: { type: Type.STRING },
                following: { type: Type.STRING },
                lastPosted: { type: Type.STRING },
                isVerified: { type: Type.BOOLEAN },
                activityLevel: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as PhoneIntelligence;
}

export async function searchSocialByQuery(query: string): Promise<SocialProfile[]> {
  const prompt = `Perform an OSINT social search for: "${query}". 
  Predict and identify potential social media profiles (LinkedIn, GitHub, X, Instagram, Facebook, TikTok, Mastodon, Reddit) based on this identifier.
  For each profile, provide deep insights: bio, estimated followers, activity level (high/medium/low), and last known post period.
  Output an array of social profiles.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            url: { type: Type.STRING },
            username: { type: Type.STRING },
            relevance: { type: Type.NUMBER },
            bio: { type: Type.STRING },
            followers: { type: Type.STRING },
            following: { type: Type.STRING },
            lastPosted: { type: Type.STRING },
            isVerified: { type: Type.BOOLEAN },
            activityLevel: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as SocialProfile[];
}

export async function scanCurrentNetwork(): Promise<NetworkScan> {
  const status = await Network.getStatus();
  
  const prompt = `Simulate a high-fidelity network scan report for an intelligence professional. 
  Current connection context: ${status.connectionType}.
  Include a public IP, ISP details, and a set of analyzed ports (some open like 80, 443, 22, some closed).
  Assess threat level.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          publicIp: { type: Type.STRING },
          isp: { type: Type.STRING },
          asn: { type: Type.STRING },
          org: { type: Type.STRING },
          threatLevel: { type: Type.STRING },
          ports: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                port: { type: Type.NUMBER },
                service: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as NetworkScan;
}

export async function searchPublicRecords(name: string, dob: string, state?: string): Promise<PublicRecord> {
  const prompt = `Perform a simulated public records search for: Name: ${name}, DOB: ${dob}${state ? `, State: ${state}` : ''}.
  Identify current address, 2-3 past addresses, and any criminal history (infractions, misdemeanors, or clear record).
  Provide a professional summary and risk level evaluation.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dob: { type: Type.STRING },
          currentAddress: { type: Type.STRING },
          pastAddresses: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          criminalHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                incident: { type: Type.STRING },
                date: { type: Type.STRING },
                location: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            }
          },
          riskLevel: { type: Type.STRING },
          summary: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text) as PublicRecord;
}

export async function discoverNetworkDevices(): Promise<NetworkDevice[]> {
  const status = await Network.getStatus();
  
  const prompt = `Simulate an ARP discovery and network device scan. 
  Network Type: ${status.connectionType}.
  Generate 5-8 realistic network devices that would be on a standard ${status.connectionType === 'wifi' ? 'home or office' : 'mobile provider'} network.
  Include: IP, MAC address, Vendor, Hostname, Device Type, and signal strength.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ip: { type: Type.STRING },
            mac: { type: Type.STRING },
            vendor: { type: Type.STRING },
            hostname: { type: Type.STRING },
            type: { type: Type.STRING },
            status: { type: Type.STRING },
            signalStrength: { type: Type.NUMBER }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as NetworkDevice[];
}

export async function analyzeNfcTag(tagHint?: string): Promise<NFCScan> {
  const prompt = `Simulate an NFC/RFID tag scan report. ${tagHint ? `The user is scanning a: ${tagHint}.` : 'Simulate a random interesting tag (e.g., access badge, passport, or credit card).'}
  Provide technical details (Tag ID, technology, type, capacity) and a 'decryptedData' section with predicted ownership or object type.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagId: { type: Type.STRING },
          technology: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          type: { type: Type.STRING },
          capacity: { type: Type.NUMBER },
          isWritable: { type: Type.BOOLEAN },
          rawPayload: { type: Type.STRING },
          decryptedData: {
            type: Type.OBJECT,
            properties: {
              owner: { type: Type.STRING },
              objectType: { type: Type.STRING },
              securityLevel: { type: Type.STRING },
              lastAccessed: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as NFCScan;
}
