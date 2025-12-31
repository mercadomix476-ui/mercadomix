
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env.local');

// Load environment variables
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Make sure to set them in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Product Data ---
const productData = `
Arroz Parboilizado Achei	7898907120272	3,3	3,5
senador	7891134001819	5,7	1
mini cracker fort	7891152321302	5,7	4
rechead morang richesrt	7891152801798	2,7	2,16
animadozoo quad chocolat p	7891152800128	1,35	1
kit pantene	7500435128353	31	28
kit dove	7891150097643	31	27
kit elseve sonho	7908785476825	31	27
kit skala	7897042016419	25	22
sha seda glos	7891150037397	9,8	7
sha seda reparaç	7891150101692	9,8	7
sha seda pretos	7891150037526	9,8	7
sha seda cachos	7891150037595	9,8	7
sha seda complex	7891150037458	9,8	7
sha seda liso	7891150037519	9,8	7
sha seda oleo	7891150037540	9,8	7
sha seda silk	7891150101616	9,8	7
sha seda glicol	7891150099845	9,8	7
cond seda pretos	7891150037342	9,8	7
cond seda liso	7891150037328	9,8	7
cond seda oleo	7891150037366	9,8	7
cond seda babosa	7891150060722	9,8	7
cond seda hidrataç	7891150088504	9,8	7
cond seda extremo	7891150037632	9,8	7
crem seda colageno	7891150080102	8,8	7
crem seda liso	7891037010048	8,8	6,5
crem seda cachos	7891037000322	8,8	6,5
creme seda pretos	7898422745301	8,8	6,5
seda boom maximo	7891150088375	15	12
gotinha	7898943754813	5	3
sha fattore jabor	7898932946885	25	20
cif	7891150090804	13	10
UAU	7891242457010	6	4
Mon bijou	7891022867374	12	10
hid paixão rosas b	78907850	10	8
hid paixão flor de lis	78914957	10	8
HID PAIXÃO AVELÃ	7896235354062	10	8
hid monange amendoas	7896235354055	10	8
oleo paixao amendoas	7896235354024	12	9
oleo paixao avalan	7898919411917	12	9
oleo paixao inspiradora	7896235354017	12	9
hid monange oliva	7898919412372	10	8
hid monange frutas	7898919412334	10	8
hid monange aveia	7898919412341	10	8
sha palmo cachos	7891024042311	9,5	7
sha palmo nutricao	7891024171639	9,5	7
sha palmo lisos	7891024161913	9,5	7
sha palmo boom	7891024034064	9,5	7
sha palmo ceramidas	7891024174210	9,5	7
sha palmo detox	7891024042908	9,5	7
oleo de banana	7897161360271	5,4	4
acetona aline	7897161360059	4,5	3,8
amoniaco aline	7897161371130	2,2	1,8
agua oxigenada 20	7897161371000	2,2	1,3
agua oxigenada aline 40	7897161371024	2,2	1,3
ampola skafe	7898658621073	2	1
sha clear ice	7891150007406	18,5	15
sha clear limpeza	7898422746216	18,5	16
aha clear sport	7891150019508	18,5	15
sha dino glice neutro	7898752300652	9	7
sabonete liq dinno glic cabeça 100ml	7898752300683	9	7
sha dinno glic n 500ml	7898752300690	12	9
sabonet liq dinno glic 500ml	7898752300966	19,5	15
amaciant sonho azul 500	7896013107613	3,5	2
amaciant sonho coco 500	7896013103523	3,5	2
amaciant sonho lavanda 500	7896013100898	3,5	2
amaciant sonho paixao 500	7896013108207	3,5	2
amaciant ype ternura 500	7896098900413	3,5	2
amac ype aconhego 500	7896098900406	3,5	2
desc po marcia camomil	7896221802232	4,5	3,3
descol po marcia ametista	7896221808128	4,5	3,3
kit banho de lua d zizi	4588888888881	6	4,9
kit banho d lua yasmin	7898973397486	6	4,9
veja gold	7891035285172	7	5,3
veja rosa	7891035285165	7	5,3
veja azul	7891035800214	7	5,3
veja verde	7891035285158	7	5,3
amaciant downy concent	7500435198240	11,99	9
oleo de coco extra virg	070341051184	8	6
colonia dinno lavanda 100	7898752300676	11,5	8,9
limp vidro vidrex	7891035800207	13	10
sha corpo dourado jaborandi 1l	7898610070925	15	13
sal milmares	703387018964	1	0,7
sabonet liq limpebem gold 1l	7898972781293	10	8
protex liq aveia 250ml	7891024114216	17	14
sabont liq aline 1l erva doce	7897161390339	10	8
sabonet liq aline neutro 1l	7897161390308	10	8
kit elseve pure	7908615017211	31	27
sabonete liq monange detox 240ml	7896235354000	10	8
sabonet rexona antbac 250ml	7891150083097	7,5	5,5
sabonet dove liq sach baunilha	7891150053236	15	12
esfoliant corpo dourad uva 150g	7908972500180	10	8
gel d cabelo sem alc	7897161347043	7	4,5
aceptol 200	7898970559436	8,7	6
CLOSEUP FRESH	7891150063075	9	7
SABONET INTIMO BABAB	7898751480386	6	4,8
DESOD DOVE ORIGINA	7506306241183	14,5	12,5
DESOD NIVIA IMPACT	7791969016029	13,8	11
DESOD REXONA AEROSOL ANTEBAC	7791293025537	13,8	11
DESOD MONANGE LAVAND	7891350034622	9	7
SENSODINE 50G	7896009400049	12,5	11
REXONA CLINICAL EXTRA	75076870	28	24
7891024134702	7891024134702	3,9	3
SAB DE AROEIRA LIQ	7898744460142	3,6	2
SABON LIQ CAMOMILA	7898744460210	3,6	2
ENCHAGUANT BUC	7509546679525	14	11,8
ENXAGUANT BUC FRESH	7891024136409	14	11,5
sab liq ala sach	7891150091016	9	7
sab liq ariel radiante	7500435141987	12,5	10
sab omo liq	7891150086951	11	10
brilhante liq	7891150086968	10	10
Vanish cores	7891035041006	11	10
Herbissimo neutro	7896049528505	5	4
Herbissimo vanilla	7896049528574	5	4
Herbissimo bio protect	7896049525726	5	4
Herbissimo tradicional	7896049528512	5	4
Leite de rosas 100ml	7896806700021	3,8	3
Leite de rosas 60ml	7896806700014	2,8	2
Barla 80g	7896806700069	5	4
Barla 140g	7896806700076	7	6
Colonia paris jardins de versalhes	7897161326055	16	15
Herbissimo fresh	7896049528604	5	4
Oleo de coco 100ml	7898744460845	7	6
Oleo de ricino	7898917757021	7	6
Reparador de pontas coco e karite	7897161351026	7	6
tonico capilar fattore	7898932946878	8,5	7
Talco flora nene	7896017721013	9,5	9
Leite de colonia tempo de amar	7896235353287	5,5	5
Leite de colonia toque de carinho	7896235353300	5,5	5
Rexona rollon bamboo e aloe vera	75063559	6	5
Reparador fattore argan	7898970559672	7	6
Lavanda flora	7896017710048	9	8
shampoo flora cachos	7896017708304	9	8
repelent nutrie spray	7898639301604	12	9
repelent spray mais	7897161347753	13	9
amaciante ype ternura 2l	7896098902417	12	9
amaciante ype aconchego 2l	7896098902400	12	9
amaciant urca maciez 2l	7896056401136	10	7
amaciant urca lavanda 2l	7896056404014	10	7
sabonet nivea karite	4006000172828	4,7	3
colonia aline paris chic	7897161326024	16	12
sabonete jhoson sandalo	7891010247393	6,8	4
sab jhoson erva doce	7891010247454	6,8	4
sab jhoson roma	7891010247423	6,8	4
`;

// --- Main Logic ---
async function main() {
  const lines = productData.trim().split('\n');
  const products = lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 3) {
      console.warn(`Skipping malformed line: ${line}`);
      return null;
    }
    
    const [name, barcode, sale_price_str, cost_price_str] = parts;
    
    if (!name.trim() || !barcode.trim()) {
        console.warn(`Skipping line with empty name or barcode: ${line}`);
        return null;
    }

    return {
      name: name.trim(),
      barcode: barcode.trim(),
      sale_price: parseFloat(sale_price_str.replace(',', '.')),
      cost_price: cost_price_str ? parseFloat(cost_price_str.replace(',', '.')) : 0,
      stock_quantity: 100, // Default stock
      unit_type: 'unidade', // Default unit type
    };
  }).filter(p => p && !isNaN(p.sale_price) && p.barcode);

  if (products.length === 0) {
    console.log("No valid products found to process.");
    return;
  }

  console.log(`Found ${products.length} products to process...`);

  // 1. Get existing barcodes
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('barcode')
    .in('barcode', products.map(p => p.barcode));

  if (fetchError) {
    console.error('Error fetching existing products:', fetchError);
    return;
  }

  const existingBarcodes = new Set(existingProducts.map(p => p.barcode));
  
  // 2. Filter out existing products
  const newProducts = products.filter(p => !existingBarcodes.has(p.barcode));

  if (newProducts.length === 0) {
    console.log('All products from the list already exist in the database. Nothing to insert.');
    return;
  }

  console.log(`Found ${newProducts.length} new products to insert...`);

  // 3. Insert new products
  const { data, error } = await supabase
    .from('products')
    .insert(newProducts)
    .select();

  if (error) {
    console.error('Error inserting new products:', error);
  } else {
    console.log(`Successfully inserted ${newProducts.length} new products!`);
  }
}

main().catch(console.error);
