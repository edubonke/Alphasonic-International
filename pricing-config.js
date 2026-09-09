/*
  Alphasonic International estimator pricing configuration.

  IMPORTANT: These are planning bands, not Alphasonic's approved rate card.
  Replace the low/high/min values with the business's own rates before treating
  the estimator as production pricing. Keeping rates here makes updates possible
  without touching the estimator logic in script.js.
*/
window.ALPHASONIC_ESTIMATOR_CONFIG = Object.freeze({
  whatsappNumber: '27746437729',
  pricing: {
    painting: {
      label: 'Painting', unit: 'm²', quantityLabel: 'Approx. paintable area',
      quantityHelp: 'Measure the wall / roof surface as closely as you can. A rough figure is enough.',
      showCondition: true, showMaterials: true,
      options: {
        interior: { label: 'Interior walls / ceilings', low: 63, high: 100, mode: 'unit', min: 1200, standardMaterialsIncluded: true },
        exterior: { label: 'Exterior walls', low: 50, high: 100, mode: 'unit', min: 1400, standardMaterialsIncluded: false },
        roof: { label: 'Roof painting', low: 50, high: 100, mode: 'unit', min: 1800, standardMaterialsIncluded: true }
      }
    },
    plumbing: {
      label: 'Plumbing', unit: 'hrs', quantityLabel: 'Estimated labour time',
      quantityHelp: 'If unsure, enter 2 hours for a small repair or 4–6 for a larger job.',
      showCondition: true, showMaterials: false,
      options: {
        standard: { label: 'Repair / maintenance', low: 400, high: 900, mode: 'unit', min: 600 },
        emergency: { label: 'Emergency plumbing', low: 600, high: 1300, mode: 'unit', min: 900 },
        geyser: { label: 'Geyser installation', low: 2500, high: 2900, mode: 'fixed', quantityHidden: true }
      }
    },
    electrical: {
      label: 'Electrical', unit: 'hrs', quantityLabel: 'Estimated labour time / quantity',
      quantityHelp: 'For hourly work enter estimated hours. For data points, enter the number of points.',
      showCondition: true, showMaterials: false,
      options: {
        standard: { label: 'General electrical work', low: 400, high: 800, mode: 'unit', min: 600, unitOverride: 'hrs' },
        emergency: { label: 'Emergency call-out', low: 600, high: 900, mode: 'fixed', quantityHidden: true },
        wiring: { label: '3-bedroom home wiring', low: 25000, high: 38000, mode: 'fixed', quantityHidden: true },
        data: { label: 'Data cabling', low: 700, high: 1100, mode: 'unit', min: 700, unitOverride: 'points', quantityLabelOverride: 'Number of data points' }
      }
    },
    ceilings: {
      label: 'Ceilings', unit: 'm²', quantityLabel: 'Approx. ceiling area',
      quantityHelp: 'Room length × width gives a useful starting estimate.',
      showCondition: true, showMaterials: true,
      options: {
        plasterboard: { label: 'Standard plasterboard ceiling', low: 250, high: 350, mode: 'unit', min: 1800, standardMaterialsIncluded: true },
        suspended: { label: 'Suspended ceiling', low: 300, high: 450, mode: 'unit', min: 2500, standardMaterialsIncluded: true },
        detailed: { label: 'Detailed / specialist ceiling', low: 350, high: 700, mode: 'unit', min: 3000, standardMaterialsIncluded: true }
      }
    },
    shopfitting: {
      label: 'Shop Fitting', unit: 'm²', quantityLabel: 'Approx. shop / fit-out area',
      quantityHelp: 'Use the floor area of the section being fitted out.',
      showCondition: true, showMaterials: true,
      options: {
        basic: { label: 'Basic retail fit-out', low: 2500, high: 5000, mode: 'unit', min: 15000, standardMaterialsIncluded: true },
        custom: { label: 'Custom / higher-detail fit-out', low: 5000, high: 9000, mode: 'unit', min: 25000, standardMaterialsIncluded: true }
      }
    },
    renovations: {
      label: 'Renovations', unit: 'm²', quantityLabel: 'Approx. renovation area',
      quantityHelp: 'Use the floor area of the rooms or section being renovated.',
      showCondition: true, showMaterials: true,
      options: {
        light: { label: 'Light renovation / refresh', low: 1000, high: 1500, mode: 'unit', min: 5000, standardMaterialsIncluded: true },
        general: { label: 'General home renovation', low: 1500, high: 2500, mode: 'unit', min: 8000, standardMaterialsIncluded: true },
        bathroom: { label: 'Bathroom renovation', low: 19000, high: 69000, mode: 'fixed', quantityHidden: true },
        kitchen: { label: 'Kitchen renovation', low: 63000, high: 190000, mode: 'fixed', quantityHidden: true }
      }
    },
    building: {
      label: 'New Build / Extension', unit: 'm²', quantityLabel: 'Approx. floor area',
      quantityHelp: 'Enter the planned built area. Professional fees, approvals and unusual site works may be separate.',
      showCondition: true, showMaterials: true,
      options: {
        standard: { label: 'Standard residential build / extension', low: 8800, high: 11000, mode: 'unit', min: 25000, standardMaterialsIncluded: true },
        higher: { label: 'Higher-spec residential build', low: 11000, high: 19000, mode: 'unit', min: 35000, standardMaterialsIncluded: true }
      }
    }
  },
  conditionMultipliers: { standard: 1, moderate: 1.12, extensive: 1.28 },
  timelineMultipliers: { flexible: 1, '1-3-months': 1, 'within-month': 1.04, urgent: 1.15 },
  timelineLabels: { flexible: 'Flexible', '1-3-months': 'Within 1–3 months', 'within-month': 'Within a month', urgent: 'Urgent / ASAP' }
});
