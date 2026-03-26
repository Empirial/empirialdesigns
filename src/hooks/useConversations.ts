import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  repoId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  commitUrl?: string;
}

export const useConversations = (userId: string | undefined, repoId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Real-time conversations listener
  useEffect(() => {
    if (!userId) return;

    const convsRef = collection(db, 'users', userId, 'conversations');
    const q = query(convsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs: Conversation[] = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title || 'New Conversation',
        updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        repoId: d.data().repoId,
      }));
      setConversations(convs);
    }, (error) => {
      console.error('Error loading conversations:', error);
    });

    return () => unsubscribe();
  }, [userId]);

  // Load messages for current conversation
  useEffect(() => {
    if (!currentConversationId || !userId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const msgsRef = collection(db, 'users', userId, 'conversations', currentConversationId, 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        setMessages(
          snapshot.docs.map((d) => ({
            id: d.id,
            role: d.data().role as 'user' | 'assistant',
            content: d.data().content,
            timestamp: d.data().createdAt?.toDate?.() || new Date(),
            toolCalls: d.data().toolCalls || undefined,
            commitUrl: d.data().commitUrl || undefined,
          }))
        );
      } catch (error: any) {
        toast({ title: 'Error loading messages', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentConversationId, userId, toast]);

  const createConversation = useCallback(async () => {
    if (!userId) return null;

    try {
      const convsRef = collection(db, 'users', userId, 'conversations');
      const docRef = await addDoc(convsRef, {
        title: 'New Conversation',
        repoId: repoId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCurrentConversationId(docRef.id);
      setMessages([]);
      toast({ title: 'New conversation started', description: 'Start chatting to build your website!' });
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({ title: 'Error creating conversation', description: error.message, variant: 'destructive' });
      return null;
    }
  }, [userId, repoId, toast]);

  const saveMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!userId || !currentConversationId) return;

    try {
      const msgsRef = collection(db, 'users', userId, 'conversations', currentConversationId, 'messages');
      await addDoc(msgsRef, {
        role: message.role,
        content: message.content,
        toolCalls: message.toolCalls || null,
        commitUrl: message.commitUrl || null,
        createdAt: serverTimestamp(),
      });

      // Update conversation updatedAt
      await updateDoc(doc(db, 'users', userId, 'conversations', currentConversationId), {
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error saving message:', error);
      toast({ title: 'Error saving message', description: error.message, variant: 'destructive' });
    }
  };

  const deleteConversation = async (id: string) => {
    if (!userId) return;

    try {
      await deleteDoc(doc(db, 'users', userId, 'conversations', id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({ title: 'Error deleting conversation', description: error.message, variant: 'destructive' });
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'conversations', id), { title });
    } catch (error: any) {
      console.error('Error updating conversation title:', error);
    }
  };

  return {
    conversations,
    currentConversationId,
    messages,
    loading,
    setMessages,
    setCurrentConversationId,
    createConversation,
    saveMessage,
    deleteConversation,
    updateConversationTitle,
  };
};
