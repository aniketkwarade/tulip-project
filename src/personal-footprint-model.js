// Shared Personal Footprint model. Desktop and mobile must consume this module
// directly so questionnaire copy, defaults, factors, and calculated results
// cannot drift between platforms.

export const PERSONAL_FOOTPRINT_QUESTIONS = Object.freeze([
  { key:'geography', title:'Where are you located?', help:'This sets your starting baseline. Different places have very different energy grids and transport patterns.', role:'contextual', options:[
    { value:'clean_transit', label:'Nordics / France / Switzerland', note:'Cleaner electricity and stronger transit. Typical home-energy baseline is about 1.8 tCO2e/yr before home-specific choices.', gridMultiplier:.6, transportMultiplier:.75, flightsMultiplier:1, homeBaselineCarbon:1.8 },
    { value:'clean_car', label:'US Pacific Northwest / Parts of Latin America', note:'Cleaner electricity, but more car dependence. Typical home-energy baseline is about 2.6 tCO2e/yr before home-specific choices.', gridMultiplier:.7, transportMultiplier:1.1, flightsMultiplier:1, homeBaselineCarbon:2.6 },
    { value:'mixed_transit', label:'UK / Japan / South Korea', note:'More mixed electricity with good transit. Typical home-energy baseline is about 3.0 tCO2e/yr before home-specific choices.', gridMultiplier:1, transportMultiplier:.8, flightsMultiplier:1, homeBaselineCarbon:3 },
    { value:'mixed_car', label:'Most of the US / Canada', note:'More mixed electricity and higher car dependence. Typical home-energy baseline is about 4.3 tCO2e/yr before home-specific choices.', gridMultiplier:1, transportMultiplier:1.1, flightsMultiplier:1, homeBaselineCarbon:4.3 },
    { value:'fossil_transit', label:'China / India / Southeast Asia', note:'More fossil-heavy electricity with mixed transit access. Typical home-energy baseline is about 4.8 tCO2e/yr before home-specific choices.', gridMultiplier:1.3, transportMultiplier:.9, flightsMultiplier:1, homeBaselineCarbon:4.8 },
    { value:'fossil_car', label:'Australia / Middle East / South Africa', note:'More fossil-heavy electricity and higher car dependence. Typical home-energy baseline is about 5.8 tCO2e/yr before home-specific choices.', gridMultiplier:1.3, transportMultiplier:1.2, flightsMultiplier:1, homeBaselineCarbon:5.8 },
  ]},
  { key:'hvac', title:'How much heating or air conditioning do you use?', help:'This adjusts your home energy use.', role:'contextual', options:[
    { value:'rarely', label:'Rarely', note:'Minimal heating or cooling', hvacMultiplier:.8, co2:0, nature:0, water:0, material:0 },
    { value:'seasonally', label:'Seasonally', note:'Typical summer or winter use', hvacMultiplier:1, co2:0, nature:0, water:0, material:0 },
    { value:'heavily', label:'Almost year-round', note:'Heavy heating or cooling demand', hvacMultiplier:1.2, co2:0, nature:0, water:0, material:0 },
  ]},
  { key:'household_size', title:'How many people share your home and its energy use?', help:'This adjusts your share of home energy use.', role:'contextual', options:[
    { value:'solo', label:'1 Person', note:'You carry the full home share', homeMultiplier:1.18, co2:0, nature:0, water:0, material:0 },
    { value:'two', label:'2 People', note:'A typical shared-home baseline', homeMultiplier:1, co2:0, nature:0, water:0, material:0 },
    { value:'three', label:'3 People', note:'Energy is spread across more people', homeMultiplier:.82, co2:0, nature:0, water:0, material:0 },
    { value:'four', label:'4 People', note:'Energy is spread across more people', homeMultiplier:.68, co2:0, nature:0, water:0, material:0 },
    { value:'five_plus', label:'5+ People', note:'The per-person home share is lower', homeMultiplier:.58, co2:0, nature:0, water:0, material:0 },
  ]},
  { key:'home_type', title:'Which home feels most like yours?', help:'A simple proxy for home size and type.', role:'direct', module:'home', options:[
    { value:'small_apt', label:'Small Apartment / Shared Room', note:'Compact home', co2:0, nature:1, water:2, material:2, homeDemandMultiplier:.65 },
    { value:'average_apt', label:'Average Apartment / Condo', note:'Typical multi-unit home', co2:0, nature:2, water:3, material:3, homeDemandMultiplier:1 },
    { value:'small_house', label:'Small Townhome / House', note:'Smaller attached or detached home', co2:0, nature:4, water:4, material:5, homeDemandMultiplier:1.35 },
    { value:'average_house', label:'Average Detached House', note:'Typical detached home', co2:0, nature:6, water:6, material:7, homeDemandMultiplier:1.75 },
    { value:'large_house', label:'Large Detached House', note:'Large home with a bigger material footprint', co2:0, nature:9, water:8, material:10, homeDemandMultiplier:2.4 },
  ]},
  { key:'home_energy', title:'Compared with similar homes in your area, how energy-intensive is yours?', help:'This moves your local baseline up or down based on how much energy your home uses.', role:'direct', module:'home', insight:{
    title:'Lower your home energy demand',
    action:'Start with the largest heating or cooling load: use a schedule, seal drafts, and choose an efficient replacement when equipment reaches end of life.',
    maintainTitle:'Protect your efficient-home habits',
    maintainAction:'Keep tracking seasonal energy use and preserve the settings and maintenance routines that keep your home below the local norm.'
  }, options:[
    { value:'lower_area', label:'Lower Than Typical for My Area', note:'Smaller bills or lighter heating and cooling', co2:0, nature:1, water:2, material:2, homeUseMultiplier:.75 },
    { value:'typical_area', label:'About Typical for My Area', note:'Roughly average for similar homes nearby', co2:0, nature:2, water:3, material:3, homeUseMultiplier:1 },
    { value:'higher_area', label:'Higher Than Typical for My Area', note:'More space, more appliances, or heavier HVAC use', co2:0, nature:3, water:4, material:4, homeUseMultiplier:1.3 },
    { value:'very_high_area', label:'Much Higher Than Typical for My Area', note:'Very high home energy demand', co2:0, nature:4, water:5, material:5, homeUseMultiplier:1.65 },
  ]},
  { key:'everyday_travel', title:'In a typical week, how do you mostly get around?', help:'Your usual day-to-day travel pattern.', role:'direct', module:'travel', insight:{
    title:'Shift one recurring trip',
    action:'Replace one regular car trip each week with walking, cycling, transit, car-sharing, or an EV where practical.',
    maintainTitle:'Keep daily travel low-carbon',
    maintainAction:'Protect the walking, cycling, or transit trips already in your routine and use a car only where it adds real value.'
  }, options:[
    { value:'walk_transit', label:'Mostly Walk, Bike, or Transit', note:'Low-carbon daily travel', co2:.4, nature:1, water:1, material:1 },
    { value:'mixed', label:'Mix Of Transit and Occasional Car', note:'A mixed travel pattern', co2:1.2, nature:2, water:3, material:3 },
    { value:'small_ev', label:'Mostly Drive a Smaller Car / EV', note:'More efficient private travel', co2:1.2, nature:6, water:9, material:10 },
    { value:'regular_gas', label:'Mostly Drive a Regular Gas Car', note:'Typical private-car commuting', co2:3.8, nature:4, water:4, material:5 },
    { value:'multiple_cars', label:'Multiple Cars / Long Daily Drives', note:'High private travel demand', co2:6, nature:8, water:10, material:14 },
  ]},
  { key:'flights', title:'About how much flying do you do in a year?', help:'Include both work and personal flights.', role:'direct', module:'travel', insight:{
    title:'Step down one flight tier',
    action:'Choose rail for a viable short route, combine trips, or replace one flight with a closer destination before booking your next year of travel.',
    maintainTitle:'Keep flying intentional',
    maintainAction:'Continue treating flights as an occasional choice and default to rail or a closer destination when the trip allows it.'
  }, options:[
    { value:'rare', label:'Rarely or Never', note:'Minimal flight impact', co2:.1, nature:.1, water:.1, material:.1 },
    { value:'annual', label:'1-2 Shorter Trips', note:'Occasional flying', co2:1.2, nature:.5, water:.5, material:.5 },
    { value:'regular', label:'About 1 Long-haul / 3-4 Shorter', note:'Moderate flying', co2:3, nature:1, water:1, material:1 },
    { value:'frequent', label:'2+ Long-haul / 5-8 Shorter', note:'Frequent flying', co2:6, nature:2, water:2, material:2 },
    { value:'very_frequent', label:'Very Frequent Flyer', note:'High volume air travel', co2:10, nature:4, water:3, material:3 },
  ]},
  { key:'diet', title:'Which option best matches how you usually eat?', help:'A simple diet proxy based on your usual habits.', role:'direct', module:'food', insight:{
    title:'Make more meals plant-forward',
    action:'Swap a few meat-heavy meals each week for legumes, tofu, grains, or other plant proteins you already enjoy.',
    maintainTitle:'Keep your plant-based pattern varied',
    maintainAction:'Keep plant proteins at the center of meals and vary the staples you buy so the habit stays practical and satisfying.'
  }, options:[
    { value:'vegan', label:'Vegan', note:'No animal products', co2:1, nature:5, water:10, material:4 },
    { value:'vegetarian', label:'Vegetarian', note:'No meat, some dairy/eggs', co2:1.5, nature:8, water:14, material:6 },
    { value:'plant_forward', label:'Mostly Plant-forward', note:'Mostly plants, occasional meat', co2:2.1, nature:12, water:18, material:8 },
    { value:'mixed', label:'Mixed Diet', note:'Meat a few times a week', co2:3.3, nature:20, water:25, material:11 },
    { value:'meat_heavy', label:'Meat With Most Meals', note:'Frequent meat and dairy', co2:4.7, nature:30, water:32, material:14 },
  ]},
  { key:'food_waste', title:'How much food from your home usually goes uneaten?', help:'Think about spoilage, leftovers, and food you throw away.', role:'direct', module:'food', insight:{
    title:'Create an eat-first routine',
    action:'Keep one visible “eat first” shelf and plan the next meal around food that is already open or nearing its use-by date.',
    maintainTitle:'Protect your low-waste routine',
    maintainAction:'Keep the meal planning and storage habits that leave very little uneaten, especially before each grocery trip.'
  }, options:[
    { value:'very_low', label:'Very Little', note:'Meals are planned well', co2:.1, nature:1, water:1, material:1 },
    { value:'some', label:'Some Leftovers Now and Then', note:'Some spoilage or uneaten food', co2:.4, nature:3, water:3, material:2 },
    { value:'average', label:'About Average', note:'Standard household pattern', co2:.8, nature:5, water:5, material:3 },
    { value:'high', label:'Quite a Bit Most Weeks', note:'Frequent uneaten food', co2:1.2, nature:8, water:7, material:5 },
  ]},
  { key:'new_clothes', title:'How often do you buy new clothes or shoes?', help:'Includes clothing, shoes, and accessories.', role:'direct', module:'stuff', insight:{
    title:'Extend the life of your wardrobe',
    action:'Repair or buy secondhand before the next new item, and use a 48-hour pause for purchases that are not replacements.',
    maintainTitle:'Keep clothing in use for longer',
    maintainAction:'Continue repairing, rewearing, and buying secondhand before adding a new garment or pair of shoes.'
  }, options:[
    { value:'rare', label:'Rarely (mostly repair / secondhand)', note:'Very few new purchases', co2:.2, nature:1, water:2, material:1 },
    { value:'occasional', label:'A Few Times a Year', note:'Seasonal basics', co2:.5, nature:3, water:10, material:3 },
    { value:'monthly', label:'New Items Most Months', note:'Regular clothing shopping', co2:1, nature:6, water:20, material:6 },
    { value:'frequent', label:'Frequent Refreshes / Trend-led', note:'High-turnover clothing buying', co2:1.8, nature:12, water:35, material:10 },
  ]},
  { key:'other_stuff', title:'How often do you buy new things for yourself or your home, like electronics, décor, furniture, hobby gear, or replacement items?', help:'Excludes groceries and clothing.', role:'direct', module:'stuff', insight:{
    title:'Slow your replacement cycle',
    action:'Repair, borrow, rent, or buy used before replacing electronics, furniture, décor, or hobby gear.',
    maintainTitle:'Keep purchases repair-first',
    maintainAction:'Continue checking repair, borrowing, and secondhand options before bringing a new product into your home.'
  }, options:[
    { value:'rare', label:'Rarely', note:'Repair-first, light buying', co2:.2, nature:1, water:1, material:2 },
    { value:'occasional', label:'A Few Times a Year', note:'Moderate replacement cycle', co2:.6, nature:3, water:3, material:8 },
    { value:'bimonthly', label:'Every Month or Two', note:'Regular convenience buying', co2:1.2, nature:5, water:5, material:16 },
    { value:'monthly', label:'Most Months', note:'Frequent retail or online orders', co2:2, nature:8, water:8, material:24 },
    { value:'heavy', label:'Large or Frequent Purchases', note:'Constant flow of new goods', co2:3.5, nature:12, water:12, material:38 },
  ]},
]);

export const PERSONAL_FOOTPRINT_BASELINE_SELECTIONS = Object.freeze({
  geography:'mixed_car', hvac:'seasonally', household_size:'two', home_type:'average_apt', home_energy:'typical_area', everyday_travel:'mixed', flights:'annual', diet:'mixed', food_waste:'some', new_clothes:'occasional', other_stuff:'occasional',
});

export const PERSONAL_FOOTPRINT_LABELS = Object.freeze({ geography:'Geography', hvac:'HVAC Usage', household_size:'Household Size', home_type:'Home Type', home_energy:'Home Energy', everyday_travel:'Everyday Travel', flights:'Flights', diet:'Diet', food_waste:'Food Waste', new_clothes:'Clothing', other_stuff:'Other Purchases' });
export const PERSONAL_FOOTPRINT_BENCHMARKS = Object.freeze({ carbon:{low:3.5,average:6.6,high:40}, nature:{low:20,average:50,high:75}, water:{low:25,average:60,high:80}, material:{low:20,average:45,high:75} });
export const PERSONAL_FOOTPRINT_PHYSICAL_FACTORS = Object.freeze({ landM2PerPoint:1900/PERSONAL_FOOTPRINT_BENCHMARKS.nature.average, waterM3PerPoint:1385/PERSONAL_FOOTPRINT_BENCHMARKS.water.average, materialTonnesPerPoint:12.3/PERSONAL_FOOTPRINT_BENCHMARKS.material.average });
export const PERSONAL_FOOTPRINT_ANNUAL_REFERENCES = Object.freeze({ carbonTonnes:PERSONAL_FOOTPRINT_BENCHMARKS.carbon.average, waterM3:1385, landM2:1900, materialTonnes:12.3 });
export const PERSONAL_FOOTPRINT_MODULES = Object.freeze([{key:'home',label:'Home'},{key:'travel',label:'Travel'},{key:'food',label:'Food'},{key:'stuff',label:'Purchasing'}]);

const roundToTenths = value => Math.round(value * 10) / 10;
export function getPersonalFootprintQuestion(key) { return PERSONAL_FOOTPRINT_QUESTIONS.find(question => question.key === key) || null; }
export function getPersonalFootprintOption(questionKey, optionValue) { return getPersonalFootprintQuestion(questionKey)?.options.find(option => option.value === optionValue) || null; }

export function calculatePersonalFootprint(state = {}) {
  const resolved = key => state[key] || PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[key] || null;
  const geography = getPersonalFootprintOption('geography',resolved('geography'));
  const hvac = getPersonalFootprintOption('hvac',resolved('hvac'));
  const household = getPersonalFootprintOption('household_size',resolved('household_size'));
  const homeType = getPersonalFootprintOption('home_type',resolved('home_type'));
  const homeEnergy = getPersonalFootprintOption('home_energy',resolved('home_energy'));
  const householdMultiplier = household?.homeMultiplier || 1;
  const hvacMultiplier = hvac?.hvacMultiplier || 1;
  const homeTypeMultiplier = homeType?.homeDemandMultiplier || 1;
  const homeUseMultiplier = homeEnergy?.homeUseMultiplier || 1;
  const totalHomeCarbon = (geography?.homeBaselineCarbon || 3) * homeTypeMultiplier * homeUseMultiplier * householdMultiplier * hvacMultiplier;
  const homeResourceFactor = householdMultiplier * hvacMultiplier;
  const totals = {carbon:0,nature:0,water:0,material:0};
  let answeredCount=0, unsureCount=0, missingCount=0;
  const breakdown = PERSONAL_FOOTPRINT_QUESTIONS.filter(question => question.role !== 'contextual').map(question => {
    const option = getPersonalFootprintOption(question.key,resolved(question.key));
    const answered = Boolean(state[question.key]);
    let co2=0,nature=0,water=0,material=0;
    if (question.key === 'home_type') {
      co2=totalHomeCarbon*.55; nature=(option?.nature||0)*homeResourceFactor; water=(option?.water||0)*homeResourceFactor; material=(option?.material||0)*householdMultiplier;
    } else if (question.key === 'home_energy') {
      co2=totalHomeCarbon*.45; nature=(option?.nature||0)*homeResourceFactor*homeUseMultiplier; water=(option?.water||0)*homeResourceFactor*homeUseMultiplier; material=(option?.material||0)*householdMultiplier;
    } else {
      const factor = question.key === 'everyday_travel' ? (geography?.transportMultiplier||1) : question.key === 'flights' ? (geography?.flightsMultiplier||1) : 1;
      co2=(option?.co2||0)*factor; nature=(option?.nature||0)*factor; water=(option?.water||0)*factor; material=(option?.material||0)*factor;
    }
    if (answered) { if (option?.isUnsure) unsureCount++; else answeredCount++; } else missingCount++;
    totals.carbon+=co2; totals.nature+=nature; totals.water+=water; totals.material+=material;
    return { key:question.key, module:question.module, answered, title:PERSONAL_FOOTPRINT_LABELS[question.key]||question.title, label:PERSONAL_FOOTPRINT_LABELS[question.key]||question.title, optionLabel:option?.label||'', note:option?.note||'', co2, carbon:co2, nature, water, material };
  });
  const answeredTotalCount = PERSONAL_FOOTPRINT_QUESTIONS.filter(question => Boolean(state[question.key])).length;
  const rankReady = answeredTotalCount === PERSONAL_FOOTPRINT_QUESTIONS.length;
  let confidence='High';
  if (answeredTotalCount<5 || missingCount>4 || unsureCount>4 || answeredCount<2) confidence='Low';
  else if (!rankReady || missingCount>0 || unsureCount>1 || answeredCount<8) confidence='Medium';
  const carbonTotal=roundToTenths(totals.carbon);
  const landTotalM2=Math.round((totals.nature*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint)/10)*10;
  const waterTotalM3=Math.round((totals.water*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint)/10)*10;
  const materialTotalTonnes=roundToTenths(totals.material*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint);
  const moduleSummaries = PERSONAL_FOOTPRINT_MODULES.map(module => {
    const items=breakdown.filter(item=>item.module===module.key);
    const carbon=items.reduce((sum,item)=>sum+item.co2,0), nature=items.reduce((sum,item)=>sum+item.nature,0), water=items.reduce((sum,item)=>sum+item.water,0), material=items.reduce((sum,item)=>sum+item.material,0);
    return {...module,carbon:roundToTenths(carbon),landM2:Math.round((nature*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint)/10)*10,waterM3:Math.round((water*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint)/10)*10,materialTonnes:roundToTenths(material*PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint),carbonShare:totals.carbon>0?Math.round(carbon/totals.carbon*100):0,natureShare:totals.nature>0?Math.round(nature/totals.nature*100):0,waterShare:totals.water>0?Math.round(water/totals.water*100):0,materialShare:totals.material>0?Math.round(material/totals.material*100):0,answeredItems:items.filter(item=>item.answered).length,totalItems:items.length};
  });
  return { anyAnswers:answeredTotalCount>0, answeredCount:answeredCount+unsureCount, answeredTotalCount, totalQuestionCount:PERSONAL_FOOTPRINT_QUESTIONS.length, rankReady, carbonTotal, landTotalM2, waterTotalM3, materialTotalTonnes, confidence, regionLabel:geography?.label||'Average Grid', householdLabel:household?.label||'2 people', breakdown, moduleSummaries,
    // Compact aliases retained for the mobile renderer.
    carbon:carbonTotal, land:landTotalM2, water:waterTotalM3, material:materialTotalTonnes, answered:answeredTotalCount, region:geography?.label||'Average baseline', sectionSummaries:moduleSummaries.map(item=>({label:item.label,carbon:item.carbon,land:item.landM2,water:item.waterM3,material:item.materialTonnes})),
  };
}
