import { useLocation } from 'react-router-dom';
import UserComplaintsView from '../../../components/complaints/user-complaints-view';

export default function UserComplaintsPage() {
  const params = new URLSearchParams(useLocation().search);
  const userId = params.get('userId');

  return <UserComplaintsView mode="user_id" targetUserId={userId} canEdit={false} />;
}
