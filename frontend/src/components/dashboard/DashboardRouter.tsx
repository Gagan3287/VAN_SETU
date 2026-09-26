import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CitizenDashboard } from './CitizenDashboard';
import { FieldOfficerDashboard } from './FieldOfficerDashboard';
import { DistrictAdminDashboard } from './DistrictAdminDashboard';
import { StateAdminDashboard } from './StateAdminDashboard';
import { FilterState } from '../MapFilters';

interface DashboardRouterProps {
  districtsGeoJson: any;
  tehsilsGeoJson: any;
  villagesGeoJson: any;
  claimsGeoJson: any;
  loadingClaims: boolean;
  claimsCount: number;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  handleResetFilters: () => void;
  districtsList: any[];
  tehsilsList: any[];
  villagesList: any[];
  fetchSpatialClaims: () => void;
  onSelectClaim: (id: string) => void;
  onOpenConflictQueue: () => void;
  onOpenClaimListModal: () => void;
  onOpenClaimFormModal: () => void;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = (props) => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'CITIZEN':
      return (
        <CitizenDashboard
          onSelectClaim={props.onSelectClaim}
          onOpenClaimFormModal={props.onOpenClaimFormModal}
        />
      );

    case 'FIELD_OFFICER':
      return <FieldOfficerDashboard {...props} />;

    case 'DISTRICT_ADMIN':
      return <DistrictAdminDashboard {...props} />;

    case 'STATE_ADMIN':
      return <StateAdminDashboard {...props} />;

    default:
      return (
        <CitizenDashboard
          onSelectClaim={props.onSelectClaim}
          onOpenClaimFormModal={props.onOpenClaimFormModal}
        />
      );
  }
};
