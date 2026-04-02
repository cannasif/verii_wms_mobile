import { Activity03Icon, PackageSearchIcon, ShipmentTrackingIcon, WarehouseIcon } from 'hugeicons-react-native';

export const HOME_MODULES = [
  { key: 'receipt', titleKey: 'modules.receipt.title', subtitleKey: 'modules.receipt.subtitle', icon: WarehouseIcon },
  { key: 'transfer', titleKey: 'modules.transfer.title', subtitleKey: 'modules.transfer.subtitle', icon: ShipmentTrackingIcon },
  { key: 'inventory', titleKey: 'modules.inventory.title', subtitleKey: 'modules.inventory.subtitle', icon: PackageSearchIcon },
  { key: 'activity', titleKey: 'modules.activity.title', subtitleKey: 'modules.activity.subtitle', icon: Activity03Icon },
] as const;
