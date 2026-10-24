import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function ChatScreen(_props: RootStackScreenProps<'Chat'>) {
  return (
    <ComingSoon
      title="Chat"
      bullets={[
        'Inverted FlatList of messages, live via Realtime',
        "Composer with text + photo (uploads to private 'chat' bucket under <bookingId>/)",
        'Shared by customer and vendor sides',
      ]}
      hooks={['useMessages(bookingId)', 'useSendMessage(bookingId)']}
    />
  );
}
