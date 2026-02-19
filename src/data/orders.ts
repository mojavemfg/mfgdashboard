import type { PurchaseOrder } from '@/types';

export const purchaseOrders: PurchaseOrder[] = [
  // COMP-001 Resistors
  { id: 'PO-001', componentId: 'COMP-001', date: '2025-08-05', deliveredDate: '2025-08-19', supplier: 'Digi-Key', quantityOrdered: 10000, unitCostAtOrder: 0.004, totalCost: 40.00, status: 'Delivered' },
  { id: 'PO-002', componentId: 'COMP-001', date: '2025-09-10', deliveredDate: '2025-09-24', supplier: 'Digi-Key', quantityOrdered: 10000, unitCostAtOrder: 0.004, totalCost: 40.00, status: 'Delivered' },
  { id: 'PO-003', componentId: 'COMP-001', date: '2025-10-15', deliveredDate: '2025-10-29', supplier: 'Digi-Key', quantityOrdered: 10000, unitCostAtOrder: 0.004, totalCost: 40.00, status: 'Delivered' },
  { id: 'PO-004', componentId: 'COMP-001', date: '2025-11-20', deliveredDate: '2025-12-04', supplier: 'Digi-Key', quantityOrdered: 10000, unitCostAtOrder: 0.004, totalCost: 40.00, status: 'Delivered' },
  { id: 'PO-005', componentId: 'COMP-001', date: '2026-01-08', deliveredDate: '2026-01-22', supplier: 'Digi-Key', quantityOrdered: 10000, unitCostAtOrder: 0.004, totalCost: 40.00, status: 'Delivered' },

  // COMP-002 Capacitors
  { id: 'PO-006', componentId: 'COMP-002', date: '2025-08-10', deliveredDate: '2025-08-24', supplier: 'Digi-Key', quantityOrdered: 8000, unitCostAtOrder: 0.006, totalCost: 48.00, status: 'Delivered' },
  { id: 'PO-007', componentId: 'COMP-002', date: '2025-09-15', deliveredDate: '2025-09-29', supplier: 'Digi-Key', quantityOrdered: 8000, unitCostAtOrder: 0.006, totalCost: 48.00, status: 'Delivered' },
  { id: 'PO-008', componentId: 'COMP-002', date: '2025-10-20', deliveredDate: '2025-11-03', supplier: 'Digi-Key', quantityOrdered: 8000, unitCostAtOrder: 0.006, totalCost: 48.00, status: 'Delivered' },
  { id: 'PO-009', componentId: 'COMP-002', date: '2025-12-01', deliveredDate: '2025-12-15', supplier: 'Digi-Key', quantityOrdered: 8000, unitCostAtOrder: 0.006, totalCost: 48.00, status: 'Delivered' },
  { id: 'PO-010', componentId: 'COMP-002', date: '2026-01-15', deliveredDate: '2026-01-29', supplier: 'Digi-Key', quantityOrdered: 8000, unitCostAtOrder: 0.0062, totalCost: 49.60, status: 'Delivered' },

  // COMP-003 Electrolytic Caps
  { id: 'PO-011', componentId: 'COMP-003', date: '2025-08-20', deliveredDate: '2025-09-10', supplier: 'Mouser', quantityOrdered: 3000, unitCostAtOrder: 0.12, totalCost: 360.00, status: 'Delivered' },
  { id: 'PO-012', componentId: 'COMP-003', date: '2025-10-05', deliveredDate: '2025-10-26', supplier: 'Mouser', quantityOrdered: 3000, unitCostAtOrder: 0.12, totalCost: 360.00, status: 'Delivered' },
  { id: 'PO-013', componentId: 'COMP-003', date: '2025-12-10', deliveredDate: '2025-12-31', supplier: 'Mouser', quantityOrdered: 3000, unitCostAtOrder: 0.115, totalCost: 345.00, status: 'Delivered' },
  { id: 'PO-014', componentId: 'COMP-003', date: '2026-02-01', deliveredDate: '2026-02-22', supplier: 'Mouser', quantityOrdered: 3000, unitCostAtOrder: 0.12, totalCost: 360.00, status: 'Pending' },

  // COMP-004 Diodes
  { id: 'PO-015', componentId: 'COMP-004', date: '2025-08-15', deliveredDate: '2025-09-05', supplier: 'Mouser', quantityOrdered: 2000, unitCostAtOrder: 0.08, totalCost: 160.00, status: 'Delivered' },
  { id: 'PO-016', componentId: 'COMP-004', date: '2025-10-10', deliveredDate: '2025-10-31', supplier: 'Mouser', quantityOrdered: 2000, unitCostAtOrder: 0.08, totalCost: 160.00, status: 'Delivered' },
  { id: 'PO-017', componentId: 'COMP-004', date: '2025-12-05', deliveredDate: '2025-12-26', supplier: 'Mouser', quantityOrdered: 2000, unitCostAtOrder: 0.079, totalCost: 158.00, status: 'Delivered' },
  { id: 'PO-018', componentId: 'COMP-004', date: '2026-01-20', deliveredDate: '2026-02-10', supplier: 'Mouser', quantityOrdered: 2000, unitCostAtOrder: 0.08, totalCost: 160.00, status: 'Delivered' },

  // COMP-005 Transistors
  { id: 'PO-019', componentId: 'COMP-005', date: '2025-08-20', deliveredDate: '2025-09-03', supplier: 'Digi-Key', quantityOrdered: 3000, unitCostAtOrder: 0.05, totalCost: 150.00, status: 'Delivered' },
  { id: 'PO-020', componentId: 'COMP-005', date: '2025-10-01', deliveredDate: '2025-10-15', supplier: 'Digi-Key', quantityOrdered: 3000, unitCostAtOrder: 0.05, totalCost: 150.00, status: 'Delivered' },
  { id: 'PO-021', componentId: 'COMP-005', date: '2025-11-10', deliveredDate: '2025-11-24', supplier: 'Digi-Key', quantityOrdered: 3000, unitCostAtOrder: 0.05, totalCost: 150.00, status: 'Delivered' },
  { id: 'PO-022', componentId: 'COMP-005', date: '2026-01-05', deliveredDate: '2026-01-19', supplier: 'Digi-Key', quantityOrdered: 3000, unitCostAtOrder: 0.048, totalCost: 144.00, status: 'Delivered' },

  // COMP-006 STM32 MCU (CRITICAL - long lead time)
  { id: 'PO-023', componentId: 'COMP-006', date: '2025-08-01', deliveredDate: '2025-09-15', supplier: 'STMicroelectronics', quantityOrdered: 500, unitCostAtOrder: 8.20, totalCost: 4100.00, status: 'Delivered' },
  { id: 'PO-024', componentId: 'COMP-006', date: '2025-09-20', deliveredDate: '2025-11-04', supplier: 'STMicroelectronics', quantityOrdered: 500, unitCostAtOrder: 8.35, totalCost: 4175.00, status: 'Delivered' },
  { id: 'PO-025', componentId: 'COMP-006', date: '2025-11-01', deliveredDate: '2025-12-16', supplier: 'STMicroelectronics', quantityOrdered: 500, unitCostAtOrder: 8.50, totalCost: 4250.00, status: 'Delivered' },
  { id: 'PO-026', componentId: 'COMP-006', date: '2025-12-15', deliveredDate: '2026-01-29', supplier: 'STMicroelectronics', quantityOrdered: 500, unitCostAtOrder: 8.50, totalCost: 4250.00, status: 'Delivered' },
  { id: 'PO-027', componentId: 'COMP-006', date: '2026-01-28', deliveredDate: '2026-03-14', supplier: 'STMicroelectronics', quantityOrdered: 300, unitCostAtOrder: 8.60, totalCost: 2580.00, status: 'Cancelled' },

  // COMP-007 Voltage Regulator
  { id: 'PO-028', componentId: 'COMP-007', date: '2025-08-25', deliveredDate: '2025-09-15', supplier: 'Mouser', quantityOrdered: 1000, unitCostAtOrder: 0.45, totalCost: 450.00, status: 'Delivered' },
  { id: 'PO-029', componentId: 'COMP-007', date: '2025-10-20', deliveredDate: '2025-11-10', supplier: 'Mouser', quantityOrdered: 1000, unitCostAtOrder: 0.44, totalCost: 440.00, status: 'Delivered' },
  { id: 'PO-030', componentId: 'COMP-007', date: '2025-12-15', deliveredDate: '2026-01-05', supplier: 'Mouser', quantityOrdered: 1000, unitCostAtOrder: 0.45, totalCost: 450.00, status: 'Delivered' },
  { id: 'PO-031', componentId: 'COMP-007', date: '2026-02-10', deliveredDate: '2026-03-03', supplier: 'Mouser', quantityOrdered: 1000, unitCostAtOrder: 0.45, totalCost: 450.00, status: 'Pending' },

  // COMP-008 PCB Main Board (WARNING - 35-day lead)
  { id: 'PO-032', componentId: 'COMP-008', date: '2025-08-10', deliveredDate: '2025-09-14', supplier: 'PCBWay', quantityOrdered: 300, unitCostAtOrder: 4.00, totalCost: 1200.00, status: 'Delivered' },
  { id: 'PO-033', componentId: 'COMP-008', date: '2025-09-25', deliveredDate: '2025-10-30', supplier: 'PCBWay', quantityOrdered: 300, unitCostAtOrder: 4.10, totalCost: 1230.00, status: 'Delivered' },
  { id: 'PO-034', componentId: 'COMP-008', date: '2025-11-05', deliveredDate: '2025-12-10', supplier: 'PCBWay', quantityOrdered: 300, unitCostAtOrder: 4.15, totalCost: 1245.00, status: 'Delivered' },
  { id: 'PO-035', componentId: 'COMP-008', date: '2025-12-20', deliveredDate: '2026-01-24', supplier: 'PCBWay', quantityOrdered: 300, unitCostAtOrder: 4.20, totalCost: 1260.00, status: 'Delivered' },
  { id: 'PO-036', componentId: 'COMP-008', date: '2026-02-05', deliveredDate: '2026-03-12', supplier: 'PCBWay', quantityOrdered: 300, unitCostAtOrder: 4.20, totalCost: 1260.00, status: 'Pending' },

  // COMP-009 USB-C Connector
  { id: 'PO-037', componentId: 'COMP-009', date: '2025-08-18', deliveredDate: '2025-09-15', supplier: 'Amphenol', quantityOrdered: 1000, unitCostAtOrder: 0.62, totalCost: 620.00, status: 'Delivered' },
  { id: 'PO-038', componentId: 'COMP-009', date: '2025-10-05', deliveredDate: '2025-11-02', supplier: 'Amphenol', quantityOrdered: 1000, unitCostAtOrder: 0.63, totalCost: 630.00, status: 'Delivered' },
  { id: 'PO-039', componentId: 'COMP-009', date: '2025-11-20', deliveredDate: '2025-12-18', supplier: 'Amphenol', quantityOrdered: 1000, unitCostAtOrder: 0.65, totalCost: 650.00, status: 'Delivered' },
  { id: 'PO-040', componentId: 'COMP-009', date: '2026-01-10', deliveredDate: '2026-02-07', supplier: 'Amphenol', quantityOrdered: 1000, unitCostAtOrder: 0.65, totalCost: 650.00, status: 'Delivered' },

  // COMP-010 ABS Housing (WARNING - 28-day lead)
  { id: 'PO-041', componentId: 'COMP-010', date: '2025-08-22', deliveredDate: '2025-09-19', supplier: 'Shenzhen Plastics', quantityOrdered: 500, unitCostAtOrder: 1.75, totalCost: 875.00, status: 'Delivered' },
  { id: 'PO-042', componentId: 'COMP-010', date: '2025-10-01', deliveredDate: '2025-10-29', supplier: 'Shenzhen Plastics', quantityOrdered: 500, unitCostAtOrder: 1.78, totalCost: 890.00, status: 'Delivered' },
  { id: 'PO-043', componentId: 'COMP-010', date: '2025-11-15', deliveredDate: '2025-12-13', supplier: 'Shenzhen Plastics', quantityOrdered: 500, unitCostAtOrder: 1.80, totalCost: 900.00, status: 'Delivered' },
  { id: 'PO-044', componentId: 'COMP-010', date: '2026-01-02', deliveredDate: '2026-01-30', supplier: 'Shenzhen Plastics', quantityOrdered: 500, unitCostAtOrder: 1.80, totalCost: 900.00, status: 'Delivered' },
  { id: 'PO-045', componentId: 'COMP-010', date: '2026-02-15', deliveredDate: '2026-03-15', supplier: 'Shenzhen Plastics', quantityOrdered: 500, unitCostAtOrder: 1.82, totalCost: 910.00, status: 'Pending' },

  // COMP-011 Ribbon Cable
  { id: 'PO-046', componentId: 'COMP-011', date: '2025-08-25', deliveredDate: '2025-09-15', supplier: 'Wurth Elektronik', quantityOrdered: 800, unitCostAtOrder: 0.37, totalCost: 296.00, status: 'Delivered' },
  { id: 'PO-047', componentId: 'COMP-011', date: '2025-10-10', deliveredDate: '2025-10-31', supplier: 'Wurth Elektronik', quantityOrdered: 800, unitCostAtOrder: 0.38, totalCost: 304.00, status: 'Delivered' },
  { id: 'PO-048', componentId: 'COMP-011', date: '2025-12-01', deliveredDate: '2025-12-22', supplier: 'Wurth Elektronik', quantityOrdered: 800, unitCostAtOrder: 0.38, totalCost: 304.00, status: 'Delivered' },
  { id: 'PO-049', componentId: 'COMP-011', date: '2026-01-20', deliveredDate: '2026-02-10', supplier: 'Wurth Elektronik', quantityOrdered: 800, unitCostAtOrder: 0.38, totalCost: 304.00, status: 'Delivered' },

  // COMP-012 Screws (OK - 7-day lead, high stock)
  { id: 'PO-050', componentId: 'COMP-012', date: '2025-09-01', deliveredDate: '2025-09-08', supplier: 'McMaster-Carr', quantityOrdered: 5000, unitCostAtOrder: 0.015, totalCost: 75.00, status: 'Delivered' },
  { id: 'PO-051', componentId: 'COMP-012', date: '2025-10-15', deliveredDate: '2025-10-22', supplier: 'McMaster-Carr', quantityOrdered: 5000, unitCostAtOrder: 0.015, totalCost: 75.00, status: 'Delivered' },
  { id: 'PO-052', componentId: 'COMP-012', date: '2025-11-25', deliveredDate: '2025-12-02', supplier: 'McMaster-Carr', quantityOrdered: 5000, unitCostAtOrder: 0.015, totalCost: 75.00, status: 'Delivered' },
  { id: 'PO-053', componentId: 'COMP-012', date: '2026-01-05', deliveredDate: '2026-01-12', supplier: 'McMaster-Carr', quantityOrdered: 5000, unitCostAtOrder: 0.015, totalCost: 75.00, status: 'Delivered' },
  { id: 'PO-054', componentId: 'COMP-012', date: '2026-02-10', deliveredDate: '2026-02-17', supplier: 'McMaster-Carr', quantityOrdered: 5000, unitCostAtOrder: 0.015, totalCost: 75.00, status: 'Delivered' },

  // COMP-013 TFT Display (CRITICAL - 42-day lead)
  { id: 'PO-055', componentId: 'COMP-013', date: '2025-08-05', deliveredDate: '2025-09-16', supplier: 'Waveshare', quantityOrdered: 200, unitCostAtOrder: 12.00, totalCost: 2400.00, status: 'Delivered' },
  { id: 'PO-056', componentId: 'COMP-013', date: '2025-09-20', deliveredDate: '2025-11-01', supplier: 'Waveshare', quantityOrdered: 200, unitCostAtOrder: 12.25, totalCost: 2450.00, status: 'Delivered' },
  { id: 'PO-057', componentId: 'COMP-013', date: '2025-11-05', deliveredDate: '2025-12-17', supplier: 'Waveshare', quantityOrdered: 200, unitCostAtOrder: 12.50, totalCost: 2500.00, status: 'Delivered' },
  { id: 'PO-058', componentId: 'COMP-013', date: '2025-12-20', deliveredDate: '2026-01-31', supplier: 'Waveshare', quantityOrdered: 200, unitCostAtOrder: 12.50, totalCost: 2500.00, status: 'Delivered' },
  { id: 'PO-059', componentId: 'COMP-013', date: '2026-01-15', deliveredDate: '2026-02-26', supplier: 'Waveshare', quantityOrdered: 150, unitCostAtOrder: 12.50, totalCost: 1875.00, status: 'Cancelled' },

  // COMP-014 EEPROM
  { id: 'PO-060', componentId: 'COMP-014', date: '2025-08-20', deliveredDate: '2025-09-10', supplier: 'Microchip', quantityOrdered: 500, unitCostAtOrder: 0.92, totalCost: 460.00, status: 'Delivered' },
  { id: 'PO-061', componentId: 'COMP-014', date: '2025-10-15', deliveredDate: '2025-11-05', supplier: 'Microchip', quantityOrdered: 500, unitCostAtOrder: 0.94, totalCost: 470.00, status: 'Delivered' },
  { id: 'PO-062', componentId: 'COMP-014', date: '2025-12-10', deliveredDate: '2025-12-31', supplier: 'Microchip', quantityOrdered: 500, unitCostAtOrder: 0.95, totalCost: 475.00, status: 'Delivered' },
  { id: 'PO-063', componentId: 'COMP-014', date: '2026-01-25', deliveredDate: '2026-02-15', supplier: 'Microchip', quantityOrdered: 500, unitCostAtOrder: 0.95, totalCost: 475.00, status: 'Delivered' },

  // COMP-015 RJ45
  { id: 'PO-064', componentId: 'COMP-015', date: '2025-08-28', deliveredDate: '2025-09-18', supplier: 'Amphenol', quantityOrdered: 400, unitCostAtOrder: 1.08, totalCost: 432.00, status: 'Delivered' },
  { id: 'PO-065', componentId: 'COMP-015', date: '2025-10-12', deliveredDate: '2025-11-02', supplier: 'Amphenol', quantityOrdered: 400, unitCostAtOrder: 1.09, totalCost: 436.00, status: 'Delivered' },
  { id: 'PO-066', componentId: 'COMP-015', date: '2025-11-25', deliveredDate: '2025-12-16', supplier: 'Amphenol', quantityOrdered: 400, unitCostAtOrder: 1.10, totalCost: 440.00, status: 'Delivered' },
  { id: 'PO-067', componentId: 'COMP-015', date: '2026-01-10', deliveredDate: '2026-01-31', supplier: 'Amphenol', quantityOrdered: 400, unitCostAtOrder: 1.10, totalCost: 440.00, status: 'Delivered' },
];
