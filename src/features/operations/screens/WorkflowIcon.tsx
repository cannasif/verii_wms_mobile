import React from 'react';
import {
  ArrowDataTransferHorizontalIcon,
  PackageIcon,
  ShippingCenterIcon,
  ShipmentTrackingIcon,
  TruckDeliveryIcon,
  TruckReturnIcon,
  WarehouseIcon,
} from 'hugeicons-react-native';
import type { WorkflowModuleConfig } from '../types/workflow';

export function WorkflowIcon({ module, size, color }: { module: WorkflowModuleConfig; size?: number; color: string }) {
  const iconSize = size ?? 20;

  switch (module.iconKey) {
    case 'receipt':
      return <WarehouseIcon size={iconSize} color={color} />;
    case 'transfer':
      return <ArrowDataTransferHorizontalIcon size={iconSize} color={color} />;
    case 'inbound':
      return <TruckDeliveryIcon size={iconSize} color={color} />;
    case 'outbound':
      return <TruckReturnIcon size={iconSize} color={color} />;
    case 'shipment':
      return <ShipmentTrackingIcon size={iconSize} color={color} />;
    case 'issue':
      return <PackageIcon size={iconSize} color={color} />;
    case 'receiptSub':
    default:
      return <ShippingCenterIcon size={iconSize} color={color} />;
  }
}
