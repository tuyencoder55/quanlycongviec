import React from 'react';
import {
  PERMISSION_ITEMS,
  type AccountPermissions,
} from '../../auth/types';

interface PermissionSwitchesProps {
  permissions: AccountPermissions;
  disabled?: boolean;
  onChange: (next: AccountPermissions) => void;
}

export const PermissionSwitches: React.FC<PermissionSwitchesProps> = ({
  permissions,
  disabled = false,
  onChange,
}) => {
  const handleToggle = (key: keyof AccountPermissions) => {
    if (disabled || key === 'can_view') return;
    onChange({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  return (
    <div className="divide-y divide-[var(--border)]">
      {PERMISSION_ITEMS.map((item) => {
        const isChecked = item.alwaysOn || disabled ? true : Boolean(permissions[item.key]);
        const isLockedSwitch = Boolean(item.alwaysOn) || disabled;

        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text leading-snug">
                {item.label}
              </div>
              <div className="text-[11.5px] text-muted-text leading-snug mt-0.5">
                {item.description}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isChecked}
              disabled={isLockedSwitch}
              onClick={() => handleToggle(item.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${
                isLockedSwitch
                  ? 'bg-primary/45 cursor-not-allowed'
                  : isChecked
                  ? 'bg-primary cursor-pointer'
                  : 'bg-faint/60 dark:bg-selected cursor-pointer'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isChecked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};
