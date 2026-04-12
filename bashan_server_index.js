// ══════════════════════════════════════════════════════
// בשן רדיאטורים — Israel Vehicle Proxy Server
// מחבר בין האתר לבין data.gov.il של משרד התחבורה
// ══════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

// Allow requests from any website (including bashan)
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Bashan Radiators — Israel Vehicle API',
    version: '1.0.0'
  });
});

// ── Main endpoint: GET /vehicle/:plate ────────────────
// Example: /vehicle/1234567
app.get('/vehicle/:plate', async (req, res) => {
  const plate = req.params.plate.replace(/[^0-9]/g, '');

  // Validate plate number
  if (!plate || plate.length < 5 || plate.length > 8) {
    return res.status(400).json({
      success: false,
      error: 'מספר לוחית לא תקין. נדרשות 7-8 ספרות.'
    });
  }

  try {
    // Call data.gov.il — Ministry of Transport official API
    const url = `https://data.gov.il/api/3/action/datastore_search` +
                `?resource_id=053cea08-09bc-40ec-8f7a-156f0677aff3` +
                `&q=${plate}` +
                `&limit=1`;

    const govResponse = await fetch(url, {
      headers: {
        'User-Agent': 'BashanRadiators-VehicleSearch/1.0'
      },
      timeout: 8000
    });

    if (!govResponse.ok) {
      throw new Error(`Government API error: ${govResponse.status}`);
    }

    const govData = await govResponse.json();

    if (!govData.success || !govData.result || !govData.result.records || govData.result.records.length === 0) {
      return res.status(404).json({
        success: false,
        error: `לא נמצא רכב עם לוחית ${plate}`
      });
    }

    const record = govData.result.records[0];

    // Clean and format the response
    const vehicle = {
      success: true,
      plate: plate,
      source: 'data.gov.il — משרד התחבורה',
      data: {
        make:        cleanField(record['tozeret_nm']        || record['tozeret_cd']),
        model:       cleanField(record['kinuy_mishari']     || record['degem_nm']),
        model_code:  cleanField(record['degem_cd']),
        year:        cleanField(record['shnat_yitzur']),
        color:       cleanField(record['tzeva_rechev']),
        fuel:        cleanField(record['sug_delek_nm']),
        engine_cc:   cleanField(record['nefach_manoa']),
        doors:       cleanField(record['mispar_dlatot']),
        total_weight:cleanField(record['mishkal_kolel']),
        ownership:   cleanField(record['baalut']),
        vin:         cleanField(record['misgeret']),
        last_test:   formatDate(record['mivchan_acharon_dt']),
        license_exp: formatDate(record['tokef_dt']),
        first_road:  formatDate(record['moed_aliya_lakvish']),
        fee_group:   cleanField(record['kvuzat_agra_nm']),
      }
    };

    return res.json(vehicle);

  } catch (error) {
    console.error('Error fetching vehicle data:', error.message);
    return res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת הנתונים. נסה שנית.',
      detail: error.message
    });
  }
});

// ── POST endpoint for multiple plates ────────────────
// Body: { plates: ["1234567", "9876543"] }
app.post('/vehicles', async (req, res) => {
  const { plates } = req.body;
  if (!plates || !Array.isArray(plates) || plates.length === 0) {
    return res.status(400).json({ success: false, error: 'נדרש מערך של לוחיות' });
  }
  if (plates.length > 10) {
    return res.status(400).json({ success: false, error: 'מקסימום 10 לוחיות בקריאה אחת' });
  }

  const results = await Promise.allSettled(
    plates.map(p => fetchSingleVehicle(p.replace(/[^0-9]/g, '')))
  );

  return res.json({
    success: true,
    results: results.map((r, i) => ({
      plate: plates[i],
      ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message })
    }))
  });
});

// ── Helper functions ──────────────────────────────────
function cleanField(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return (str === '' || str === '0' || str === 'null') ? null : str;
}

function formatDate(val) {
  if (!val) return null;
  return String(val).replace('T00:00:00', '').trim();
}

async function fetchSingleVehicle(plate) {
  const url = `https://data.gov.il/api/3/action/datastore_search` +
              `?resource_id=053cea08-09bc-40ec-8f7a-156f0677aff3` +
              `&q=${plate}&limit=1`;
  const res  = await fetch(url, { timeout: 8000 });
  const data = await res.json();
  if (!data.success || !data.result?.records?.length) {
    throw new Error(`לא נמצא רכב ${plate}`);
  }
  return { success: true, plate, data: data.result.records[0] };
}

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Bashan Vehicle Server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/vehicle/1234567`);
});
