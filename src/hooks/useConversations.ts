import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  repo_id?: string;
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

  // Load conversations
  useEffect(() => {
    if (!userId) return;

    const loadConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    };

    loadConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Load messages for current conversation
  useEffect(() => {
    if (!currentConversationId) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setMessages(
        data.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          toolCalls: msg.tool_calls ? (Array.isArray(msg.tool_calls) ? msg.tool_calls : []) : undefined,
          commitUrl: msg.commit_url || undefined,
        }))
      );
      setLoading(false);
    };

    loadMessages();
  }, [currentConversationId, toast]);

  // Create new conversation
  const createConversation = async () => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        repo_id: repoId,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    setCurrentConversationId(data.id);
    setMessages([]);
    toast({
      title: "New conversation started",
      description: "Start chatting to build your website!",
    });
    return data.id;
  };

  // Save message
  const saveMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!userId || !currentConversationId) return;

    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      repo_id: repoId,
      conversation_id: currentConversationId,
      role: message.role,
      content: message.content,
      tool_calls: message.toolCalls,
      commit_url: message.commitUrl,
    });

    if (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error saving message",
        description: error.message,
        variant: "destructive",
      });
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId);
  };

  // Delete conversation
  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  // Update conversation title
  const updateConversationTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id);

    if (error) {
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
