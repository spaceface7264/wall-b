
import { useParams } from 'react-router-dom';
import UserProfile from '../../components/UserProfile';

export default function PublicProfile() {
  const params = useParams();
  const userId = params.userId;

  return <UserProfile userId={userId} showBackButton={true} />;
}
