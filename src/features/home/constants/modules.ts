import { Activity03Icon, PackageSearchIcon, ShipmentTrackingIcon, WarehouseIcon } from 'hugeicons-react-native';

export const HOME_MODULES = [
  { key: 'receipt', titleKey: 'modules.receipt.title', subtitleKey: 'modules.receipt.subtitle', icon: WarehouseIcon, permissionCode: 'wms.goods-receipt.view' },
  { key: 'transfer', titleKey: 'modules.transfer.title', subtitleKey: 'modules.transfer.subtitle', icon: ShipmentTrackingIcon, permissionCode: 'wms.transfer.view' },
  { key: 'inventory', titleKey: 'modules.inventory.title', subtitleKey: 'modules.inventory.subtitle', icon: PackageSearchIcon, permissionCode: 'wms.inventory-count.view' },
  { key: 'activity', titleKey: 'modules.activity.title', subtitleKey: 'modules.activity.subtitle', icon: Activity03Icon, permissionCode: 'dashboard.view' },
] as const;
