
// Cloudflare API Configuration
// For Next.js deployment, use process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_API_TOKEN = "3jfK5akYvmRVMgyTr_oxTwp8lfRAO4p2wsf36m_T";
const ZONE_ID = "8fb7f78309acd34a1548ee13637c0165";

const headers = {
  'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
  'Content-Type': 'application/json',
};

export interface DNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

export const getDNSRecords = async (subdomainPrefix: string): Promise<DNSRecord[]> => {
  try {
    const fullHost = `${subdomainPrefix}.tnxbd.top`;
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${fullHost}`, {
      method: 'GET',
      headers
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.errors[0]?.message || "Failed to fetch DNS records");
    return data.result;
  } catch (error: any) {
    console.error("Cloudflare Fetch Error:", error);
    throw error;
  }
};

export const createDNSRecord = async (record: DNSRecord) => {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...record,
        ttl: record.ttl || 1, // 1 for 'Automatic'
      })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.errors[0]?.message || "Cloudflare API error while creating record");
    return data.result;
  } catch (error: any) {
    throw error;
  }
};

export const deleteDNSRecord = async (recordId: string) => {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.errors[0]?.message || "Failed to delete record");
    return data.result;
  } catch (error: any) {
    throw error;
  }
};
