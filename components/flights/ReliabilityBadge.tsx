import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

export type ReliabilityLevel = 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited' | 'High' | 'Medium' | 'Low';

interface ReliabilityBadgeProps {
  level: ReliabilityLevel;
  label?: string;
  showIcon?: boolean;
  size?: 'small' | 'medium';
}

export default function ReliabilityBadge({
  level,
  label,
  showIcon = true,
  size = 'small',
}: ReliabilityBadgeProps) {
  const getColor = (): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (level) {
      case 'Very Stable':
      case 'High':
        return 'success';
      case 'Moderate':
      case 'Medium':
        return 'info';
      case 'Seasonal':
        return 'warning';
      case 'Limited':
      case 'Low':
        return 'error';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'Very Stable':
      case 'High':
        return <CheckCircleIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />;
      case 'Moderate':
      case 'Medium':
        return <InfoIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />;
      case 'Seasonal':
        return <WarningIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />;
      case 'Limited':
      case 'Low':
        return <ErrorIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />;
      default:
        return null;
    }
  };

  const displayLabel = label || level;

  const iconElement = showIcon ? getIcon() : null;
  
  return (
    <Chip
      {...(iconElement && { icon: iconElement })}
      label={displayLabel}
      color={getColor()}
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderWidth: 1.5,
      }}
    />
  );
}
