// בשן רדיאטורים — Israel Vehicle Proxy Server v2
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const app     = express();
const PORT    = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({status:'running',service:'Bashan Vehicle API v2',version:'2.0.0'}));

app.get('/vehicle/:plate', async (req, res) => {
  const plate = req.params.plate.replace(/[^0-9]/g,'');
  if(!plate||plate.length<5||plate.length>8)
    return res.status(400).json({success:false,error:'מספר לוחית לא תקין'});

  try {
    // Method 1: exact filter by mispar_rechev
    let records = await searchGov(`filters={"mispar_rechev":"${plate}"}&limit=1`);

    // Method 2: fallback with q= and filter manually
    if(!records||records.length===0){
      const all = await searchGov(`q=${plate}&limit=5`);
      records = (all||[]).filter(r=>String(r['mispar_rechev']||'').replace(/\D/g,'')=== plate);
      if(!records.length) records = all||[];
    }

    if(!records||records.length===0)
      return res.status(404).json({success:false,error:`לא נמצא רכב עם לוחית ${plate}`});

    const r = records[0];
    return res.json({
      success: true,
      plate,
      source: 'data.gov.il — משרד התחבורה',
      data: {
        make:        c(r['tozeret_nm'])     || c(r['tozeret_cd']),
        model:       c(r['kinuy_mishari'])  || c(r['degem_nm']),
        model_code:  c(r['degem_cd']),
        year:        c(r['shnat_yitzur']),
        color:       c(r['tzeva_rechev']),
        fuel:        c(r['sug_delek_nm']),
        engine_cc:   c(r['nefach_manoa']),
        doors:       c(r['mispar_dlatot']),
        vin:         c(r['misgeret']),
        last_test:   d(r['mivchan_acharon_dt']),
        license_exp: d(r['tokef_dt']),
        first_road:  d(r['moed_aliya_lakvish']),
      }
    });
  } catch(e) {
    console.error(e.message);
    return res.status(500).json({success:false,error:'שגיאה: '+e.message});
  }
});

async function searchGov(params) {
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=053cea08-09bc-40ec-8f7a-156f0677aff3&${params}`;
  const res = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 BashanRadiators/2.0','Accept':'application/json'},timeout:10000});
  const data = await res.json();
  return data?.result?.records || [];
}

function c(v){if(v==null)return null;const s=String(v).trim();return(s===''||s==='0'||s==='null')?null:s;}
function d(v){if(!v)return null;return String(v).replace('T00:00:00','').split('T')[0].trim();}

app.listen(PORT,()=>console.log(`✅ Bashan Vehicle Server v2 on port ${PORT}`));
