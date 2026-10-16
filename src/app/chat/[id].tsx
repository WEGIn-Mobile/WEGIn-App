import { useLocalSearchParams } from 'expo-router';
import { Chat } from '@/components/chat';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Chat key={id} userId={id} />;
}
