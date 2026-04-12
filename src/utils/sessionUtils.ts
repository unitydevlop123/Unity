export interface SessionInfo {
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  lat: number;
  lon: number;
  timezone: string;
  isVpn: boolean;
  isHosting: boolean;
  lastActive: string;
  isCurrent: boolean;
  continent?: string;
  calling_code?: string;
  flag_img?: string;
  flag_emoji?: string;
  org?: string;
  vpnDetails?: {
    is_proxy: boolean;
    is_tor: boolean;
    is_anonymous: boolean;
    is_vpn: boolean;
  };
  hostingProvider?: string;
}

export const getDeviceType = (ua: string): string => {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  if (/bot|googlebot|crawler|spider|robot|crawling/i.test(ua)) {
    return "Bot";
  }
  return "Desktop";
};

export const getBrowserInfo = (ua: string): string => {
  if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) return "Chrome";
  if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) return "Safari";
  if (ua.indexOf("Firefox") !== -1) return "Firefox";
  if (ua.indexOf("Edg") !== -1) return "Edge";
  if (ua.indexOf("MSIE") !== -1 || !!(window as any).MSInputMethodContext && !!(document as any).documentMode) return "IE";
  return "Unknown Browser";
};

export const getOSInfo = (ua: string): string => {
  if (ua.indexOf("Win") !== -1) return "Windows";
  if (ua.indexOf("Mac") !== -1 && ua.indexOf("iPhone") === -1 && ua.indexOf("iPad") === -1) return "MacOS";
  if (ua.indexOf("Linux") !== -1) return "Linux";
  if (ua.indexOf("Android") !== -1) return "Android";
  if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1 || ua.indexOf("iPod") !== -1) return "iOS";
  return "Unknown OS";
};

const detectVpnAndHosting = async (ip: string, ispName: string, orgName: string): Promise<{ 
  isVpn: boolean; 
  isHosting: boolean;
  vpnDetails?: { is_proxy: boolean; is_tor: boolean; is_anonymous: boolean; is_vpn: boolean };
  hostingProvider?: string;
}> => {
  const combinedStr = (ispName + " " + orgName).toLowerCase();
  const regexIsVpn = /vpn|proxy|tunnel|anonymizer/i.test(combinedStr);
  const regexIsHosting = /amazon|google|digitalocean|vultr|linode|cloud|hosting|server|datacenter|ovh|hetzner/i.test(combinedStr);

  return {
    isVpn: regexIsVpn,
    isHosting: regexIsHosting,
    vpnDetails: {
      is_proxy: regexIsVpn,
      is_tor: false,
      is_anonymous: regexIsVpn,
      is_vpn: regexIsVpn
    },
    hostingProvider: regexIsHosting ? orgName : undefined
  };
};

const fetchWithTimeout = async (url: string, options: any = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const fetchSessionDetails = async (): Promise<Partial<SessionInfo>> => {
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const apis = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parser: async (data: any) => ({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        location: `${data.city}, ${data.country_name}`,
        isp: data.org || data.isp || "Unknown",
        org: data.org || data.isp || "Unknown",
        lat: data.latitude || data.lat || 0,
        lon: data.longitude || data.lon || 0,
        timezone: data.timezone || "Unknown",
        continent: data.continent_code,
        calling_code: data.country_calling_code?.replace('+', '') || "Unknown",
        flag_img: `https://flagcdn.com/w40/${data.country?.toLowerCase()}.png`,
        flag_emoji: getFlagEmoji(data.country),
        countryCode: data.country
      })
    },
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      parser: async (data: any) => {
        if (!data.success) throw new Error(data.message || "ipwho.is failed");
        return {
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country,
          location: `${data.city}, ${data.country}`,
          isp: data.connection?.isp || data.isp || data.org || data.connection?.org || "Unknown",
          org: data.connection?.org || data.org || data.isp || data.connection?.isp || "Unknown",
          lat: data.latitude || data.lat || 0,
          lon: data.longitude || data.lon || 0,
          timezone: data.timezone?.id || data.timezone || data.timezone_name || "Unknown",
          continent: data.continent || data.continent_name || "Unknown",
          calling_code: data.calling_code || data.country_calling_code?.replace('+', '') || data.country_code || "Unknown",
          flag_img: data.flag?.img,
          flag_emoji: data.flag?.emoji || getFlagEmoji(data.country_code),
          countryCode: data.country_code
        };
      }
    },
    {
      name: 'geoiplookup',
      url: 'https://json.geoiplookup.io/',
      parser: async (data: any) => ({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        location: `${data.city}, ${data.country_name}`,
        isp: data.isp || data.org || "Unknown",
        org: data.org || data.isp || "Unknown",
        lat: data.latitude || data.lat || 0,
        lon: data.longitude || data.lon || 0,
        timezone: data.timezone_name || data.timezone || "Unknown",
        continent: data.continent_name,
        calling_code: data.country_code || "Unknown",
        flag_img: `https://flagcdn.com/w40/${data.country_code?.toLowerCase()}.png`,
        flag_emoji: getFlagEmoji(data.country_code),
        countryCode: data.country_code
      })
    },
    {
      name: 'freeipapi.com',
      url: 'https://freeipapi.com/api/json',
      parser: async (data: any) => ({
        ip: data.ipAddress,
        city: data.cityName,
        region: data.regionName,
        country: data.countryName,
        location: `${data.cityName}, ${data.countryName}`,
        isp: data.isp || "Unknown",
        org: data.org || "Unknown",
        lat: data.latitude || data.lat || 0,
        lon: data.longitude || data.lon || 0,
        timezone: data.timeZone || "Unknown",
        continent: data.continentName,
        calling_code: "Unknown",
        flag_img: `https://flagcdn.com/w40/${data.countryCode?.toLowerCase()}.png`,
        flag_emoji: getFlagEmoji(data.countryCode),
        countryCode: data.countryCode
      })
    },
    {
      name: 'db-ip.com',
      url: 'https://api.db-ip.com/v2/free/self',
      parser: async (data: any) => ({
        ip: data.ipAddress,
        city: data.city,
        region: data.stateProv,
        country: data.countryName,
        location: `${data.city}, ${data.countryName}`,
        isp: "Unknown",
        org: "Unknown",
        lat: 0,
        lon: 0,
        timezone: "Unknown",
        continent: data.continentName,
        calling_code: "Unknown",
        flag_img: `https://flagcdn.com/w40/${data.countryCode?.toLowerCase()}.png`,
        flag_emoji: getFlagEmoji(data.countryCode),
        countryCode: data.countryCode
      })
    },
    {
      name: 'cloudflare',
      url: 'https://www.cloudflare.com/cdn-cgi/trace',
      parser: async (text: string) => {
        const lines = text.split('\n');
        const data: any = {};
        lines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) data[key] = value;
        });
        
        try {
          const geoRes = await fetchWithTimeout(`https://ipwho.is/${data.ip}`, {}, 3000);
          const geoData = await geoRes.json();
          if (geoData.success) {
            return {
              ip: geoData.ip,
              city: geoData.city,
              region: geoData.region,
              country: geoData.country,
              location: `${geoData.city}, ${geoData.country}`,
              isp: geoData.connection?.isp,
              org: geoData.connection?.org,
              lat: geoData.latitude,
              lon: geoData.longitude,
              timezone: geoData.timezone?.id,
              continent: geoData.continent,
              calling_code: geoData.calling_code,
              flag_img: geoData.flag?.img,
              flag_emoji: geoData.flag?.emoji || getFlagEmoji(geoData.country_code),
              countryCode: geoData.country_code
            };
          }
        } catch (e) {}
        
        return {
          ip: data.ip,
          location: "Unable to detect location",
          isp: "Cloudflare Network",
          org: "Cloudflare",
          city: "Unknown",
          region: "Unknown",
          country: "Unknown",
          lat: 0,
          lon: 0
        };
      }
    },
    {
      name: 'ipify',
      url: 'https://api.ipify.org?format=json',
      parser: async (data: any) => ({
        ip: data.ip,
        location: "Unable to detect location",
        isp: "Unknown",
        org: "Unknown",
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        lat: 0,
        lon: 0
      })
    }
  ];

  for (const api of apis) {
    try {
      const res = await fetchWithTimeout(api.url, { cache: 'no-store' }, 6000);
      if (!res.ok) throw new Error(`${api.name} returned ${res.status}`);
      
      let data;
      if (api.name === 'cloudflare') {
        data = await res.text();
      } else {
        data = await res.json();
      }
      
      if (api.name === 'ipwho.is' && data.success === false) continue;
      if (api.name === 'ipapi.co' && data.error) continue;
      if (api.name === 'db-ip.com' && data.errorCode) continue;
      if (api.name === 'freeipapi.com' && !data.ipAddress) continue;

      const parsed = await api.parser(data);
      const { isVpn, isHosting, vpnDetails, hostingProvider } = await detectVpnAndHosting(parsed.ip, parsed.isp || "", parsed.org || "");

      return {
        ...parsed,
        isVpn,
        isHosting,
        vpnDetails,
        hostingProvider
      };
    } catch (err) {
      console.warn(`Failed to fetch from ${api.name}:`, err);
    }
  }

  return {
    ip: "Unable to detect location",
    isp: "Unable to detect location",
    org: "Unable to detect location",
    location: "Unable to detect location",
    continent: "Unable to detect location",
    calling_code: "Unknown",
    lat: 0,
    lon: 0
  };
};
