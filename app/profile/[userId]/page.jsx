'use client';

import { useParams } from 'next/navigation';
import UserProfile from '../../components/UserProfile';

export default function PublicProfile() {
  const params = useParams();
  const userId = params.userId;

  return <UserProfile userId={userId} showBackButton={true} />;
}
