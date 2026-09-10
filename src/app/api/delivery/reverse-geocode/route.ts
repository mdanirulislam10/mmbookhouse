import { NextRequest, NextResponse } from 'next/server';
import { validateIndianPincode, DEFAULT_PINCODE } from '@/lib/data/pincodeData';

const GEO_HUBS = [
  { pincode: '732101', lat: 25.0108, lng: 88.1411, name: 'Malda Town', district: 'Malda' },
  { pincode: '734001', lat: 26.7271, lng: 88.3953, name: 'Siliguri', district: 'Darjeeling' },
  { pincode: '733129', lat: 25.6173, lng: 88.1252, name: 'Raiganj', district: 'Uttar Dinajpur' },
  { pincode: '733134', lat: 25.2217, lng: 88.7667, name: 'Balurghat', district: 'Dakshin Dinajpur' },
  { pincode: '742101', lat: 24.0988, lng: 88.2679, name: 'Berhampore', district: 'Murshidabad' },
  { pincode: '700073', lat: 22.5726, lng: 88.3639, name: 'Kolkata Boipara', district: 'Kolkata' },
];

function findNearestHub(lat: number, lng: number) {
  let closest = GEO_HUBS[0];
  let minDistance = Infinity;

  for (const hub of GEO_HUBS) {
    const dLat = hub.lat - lat;
    const dLng = hub.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = hub;
    }
  }

  return closest;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon') || searchParams.get('lng');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { success: false, error: 'Latitude and Longitude query parameters are required' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { success: false, error: 'Invalid numeric coordinate values' },
      { status: 400 }
    );
  }

  let detectedPin: string | null = null;
  let detectedSource: 'nominatim' | 'nearest_hub' = 'nearest_hub';
  let areaName: string = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MMBookHouseMalda/1.0 (contact@mmbookhouse.in)',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawPostcode = data?.address?.postcode;
      areaName = data?.address?.suburb || data?.address?.city || data?.address?.town || data?.address?.county || '';

      if (rawPostcode) {
        const validation = validateIndianPincode(rawPostcode);
        if (validation.isValid) {
          detectedPin = validation.normalizedPincode;
          detectedSource = 'nominatim';
        }
      }
    }
  } catch {
    // Network or timeout: gracefully proceed to nearest regional hub matching
  }

  if (!detectedPin) {
    const nearest = findNearestHub(lat, lon);
    detectedPin = nearest.pincode;
    areaName = nearest.name;
    detectedSource = 'nearest_hub';
  }

  return NextResponse.json({
    success: true,
    data: {
      pincode: detectedPin,
      area: areaName,
      source: detectedSource,
      lat,
      lon,
    },
  });
}
