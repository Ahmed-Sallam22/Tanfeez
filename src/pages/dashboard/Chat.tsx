/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  useGetParticipantsByTransactionQuery,
  useGetThreadInfiniteQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  type Participant,
  type ThreadMessage,
} from "@/api/chatApi";
import { useGetUsersQuery, type UserListItem } from "@/api/user.api"; // NEW

type ChatProps = {
  transactionId?: string | number;
  pageSize?: number;
  currentUserId?: number; // optional, for showing Edit/Delete on own messages
};

export default function Chat({
  transactionId: transactionIdProp,
  pageSize = 20,
  currentUserId,
}: ChatProps) {
  const { t } = useTranslation();
  const params = useParams();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composeInputRef = useRef<HTMLInputElement | null>(null); // NEW
  const location = useLocation();
  const transactionCode = (location.state as { txCode?: string })?.txCode || "";
  // Modal state (NEW)
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Resolve transactionId from props or route (supports :transactionId or legacy :id)
  const transactionId = useMemo(() => {
    return transactionIdProp ?? params.transactionId ?? params.id ?? "";
  }, [transactionIdProp, params.transactionId, params.id]);

  // Selected user id from route param if present
  const initialUserIdFromParams = useMemo(() => {
    return params.userId ? Number(params.userId) : undefined;
  }, [params.userId]);

  // Load participants (left pane)
  const { data: participantsData, isLoading: participantsLoading } =
    useGetParticipantsByTransactionQuery(
      { transactionId },
      { skip: !transactionId }
    );

  const participants = useMemo(
    () => participantsData?.participants ?? [],
    [participantsData]
  );

  // Load ALL users for the modal (NEW)
  const {
    data: allUsers,
    isLoading: usersLoading,
    isError: usersError,
  } = useGetUsersQuery(undefined); // your endpoint returns the full list

  // Selection state
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    initialUserIdFromParams
  );

  // Default to first participant when loaded
  useEffect(() => {
    if (!selectedUserId && participants.length > 0) {
      setSelectedUserId(participants[0].user_id);
    }
  }, [participants, selectedUserId]);

  // Thread paging (infinite-style)
  const [page, setPage] = useState(1);

  // Reset page when switching users or transaction
  useEffect(() => {
    setPage(1);
  }, [selectedUserId, transactionId]);

  const { data: threadData, isFetching: threadFetching } =
    useGetThreadInfiniteQuery(
      {
        transactionId: transactionId as string | number,
        userId: selectedUserId as number,
        page,
        pageSize,
      },
      { skip: !transactionId || !selectedUserId }
    );

  const messages = useMemo<ThreadMessage[]>(
    () => threadData?.results ?? [],
    [threadData]
  );

  const hasMore = useMemo(() => {
    if (!threadData) return false;
    if (typeof threadData.next === "string") return Boolean(threadData.next);
    if (typeof threadData.count === "number")
      return messages.length < threadData.count;
    return messages.length > 0 && messages.length % pageSize === 0;
  }, [threadData, messages.length, pageSize]);

  // ------ Send / Edit / Delete mutations ------
  const [createMessage, { isLoading: sending }] = useCreateMessageMutation();
  const [updateMessage, { isLoading: updating }] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  // Compose state
  const [compose, setCompose] = useState("");

  async function handleSend() {
    if (!compose.trim() || !transactionId || !selectedUserId) return;
    await createMessage({
      transaction_id: transactionId,
      user_id: selectedUserId,
      message: compose.trim(),
    });
    setCompose("");
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      composeInputRef.current?.focus();
    }, 0);
  }

  // Menu + editing state
  const [menuOpenForId, setMenuOpenForId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  function openMenu(mid: number) {
    setMenuOpenForId((curr) => (curr === mid ? null : mid));
  }

  function startEdit(msg: ThreadMessage) {
    setEditingId(msg.id);
    setEditingText(msg.is_deleted ? "" : msg.message || "");
    setMenuOpenForId(null);
  }

  async function saveEdit() {
    if (!editingId || !selectedUserId || !transactionId) return;
    const text = editingText.trim();
    if (!text) return;

    await updateMessage({
      messageId: editingId,
      data: { message: text },
      transactionId, // NEW
      userId: selectedUserId, // NEW
    });

    setEditingId(null);
    setEditingText("");
  }

  async function handleDelete(mid: number) {
    if (!selectedUserId || !transactionId) return;

    await deleteMessage({
      messageId: mid,
      transactionId, // NEW
      userId: selectedUserId, // NEW
    });

    setMenuOpenForId(null);
  }

  function handleSelectParticipant(p: Participant) {
    setSelectedUserId(p.user_id);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      composeInputRef.current?.focus();
    }, 0);
  }

  // Start chat with any user from modal (NEW)
  function startChatWithUser(u: UserListItem) {
    setSelectedUserId(u.id);
    setShowNewChat(false);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      composeInputRef.current?.focus();
    }, 0);

    // Optional: reflect in URL if your route supports /chat/:transactionId/:userId
    // const tId = String(transactionId || "");
    // if (tId) navigate(`/chat/${tId}/${u.id}`);
  }

  // Scroll to bottom on first load for a given selection
  useEffect(() => {
    if (page === 1 && messages.length > 0) {
      const id = setTimeout(() => {
        if (scrollRef.current)
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
      return () => clearTimeout(id);
    }
  }, [page, messages.length]);

  // Helpers
  const formatTime = (iso?: string | null) =>
    iso ? dayjs(iso).format("h:mm A") : "";

  // Edit/Delete allowed within 15 minutes (your WhatsApp-like rule)
  const canModifyMessage = (msg: ThreadMessage) => {
    if (!msg.timestamp) return false;
    const messageTime = dayjs(msg.timestamp);
    const now = dayjs();
    const diffInMinutes = now.diff(messageTime, "minute");
    return diffInMinutes <= 15;
  };

  const selectedParticipant = useMemo(
    () => participants.find((p) => p.user_id === selectedUserId),
    [participants, selectedUserId]
  );

  // Build helpers for modal badges
  const participantSet = useMemo(
    () => new Set(participants.map((p) => p.user_id)),
    [participants]
  );

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    const base = (allUsers ?? []) as UserListItem[];
    const withoutSelf = currentUserId
      ? base.filter((u) => u.id !== currentUserId)
      : base;
    if (!term) return withoutSelf;
    return withoutSelf.filter((u) =>
      (u.username || "").toLowerCase().includes(term)
    );
  }, [allUsers, userSearch, currentUserId]);
  // Who did we pick from the modal (even if not in participants yet)?
  const selectedUserFromAll = useMemo(
    () =>
      (allUsers as UserListItem[] | undefined)?.find(
        (u) => u.id === selectedUserId
      ),
    [allUsers, selectedUserId]
  );

  // Use participants -> allUsers -> fallback
  const selectedUserName = useMemo(() => {
    return (
      selectedParticipant?.username ??
      selectedUserFromAll?.username ??
      (selectedUserId ? `${t("chat.user")} ${selectedUserId}` : "")
    );
  }, [
    selectedParticipant?.username,
    selectedUserFromAll?.username,
    selectedUserId,
    t,
  ]);

  const messagesAsc = useMemo<ThreadMessage[]>(
    () =>
      [...(messages ?? [])].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [messages]
  );
  const prevHeightRef = useRef(0);

  function handleLoadOlder() {
    if (scrollRef.current)
      prevHeightRef.current = scrollRef.current.scrollHeight;
    setPage((p) => p + 1);
  }

  // After messages change and fetch finishes, adjust scroll by the delta height
  useEffect(() => {
    if (!threadFetching && prevHeightRef.current && scrollRef.current) {
      const el = scrollRef.current;
      const delta = el.scrollHeight - prevHeightRef.current;
      el.scrollTop = el.scrollTop + delta; // maintain viewport
      prevHeightRef.current = 0;
    }
  }, [messagesAsc.length, threadFetching]);
  return (
    <div className="flex h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Left Sidebar: Participants */}
      <div className="w-1/3 bg-gray-50 border-r border-gray-200">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-800">
            {t("chat.conversations")}
          </h2>
          {/* + button (NEW) */}
          <button
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[#2d5147] active:scale-95 transition"
            title={t("chat.startNewChat")}
          >
            +
          </button>
        </div>

        <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100%-5rem)]">
          {!participantsLoading && participants.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-400 text-xl">💬</span>
              </div>
              <div className="text-sm text-gray-500">
                {t("chat.noParticipantsFound")}
              </div>
            </div>
          )}

          {participants.map((p) => {
            const isActive = selectedUserId === p.user_id;
            const unread = Number(p.unseen_count || 0);
            return (
              <div
                key={p.user_id}
                className={`group relative p-4 cursor-pointer rounded-lg transition-all duration-200  ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "bg-white hover:shadow-sm border border-gray-100"
                }`}
                onClick={() => handleSelectParticipant(p)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-semibold capitalize truncate text-sm ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {p.username}
                      </h3>
                      <div
                        className={`text-xs ${
                          isActive ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {formatTime(p.last_message_at)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate ${
                          isActive ? "text-white/80" : "text-gray-600"
                        }`}
                      >
                        {p.last_message || t("chat.lastMessage")}
                      </p>
                      {unread > 0 && (
                        <span
                          className={`min-w-[18px] h-4 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                            isActive
                              ? "bg-white text-[var(--color-primary)]"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Section: Conversation */}
      <div className="w-2/3 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center  justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className=" flex items-center capitalize  w-full gap-2 justify-between">
                  <div>
                    <h2 className="font-bold text-xl capitalize text-gray-900">
                      {selectedUserId
                        ? selectedUserName
                        : t("chat.selectConversation")}
                    </h2>
                  </div>
                </div>

                {threadFetching && (
                  <div className="flex items-center gap-2 ">
                    <span className="text-xs text-[var(--color-primary)] font-medium">
                      {t("chat.syncingMessages")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              {transactionCode && (
                <div className="text-md text-gray-500 mt-1">
                  {t("chat.transaction")}: {transactionCode}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-0 bg-gray-50">
          {/* Inner flex column that keeps content anchored to the bottom */}
          <div className="min-h-full flex flex-col justify-end p-6 space-y-4">
            {/* Load older button stays above the messages (like WhatsApp) */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => handleLoadOlder()}
                  className="px-6 py-2 ..."
                >
                  {threadFetching
                    ? t("chat.loadingOlderMessages")
                    : t("chat.loadOlderMessages")}
                </button>
              </div>
            )}

            {/* Thread errors */}

            {/* Messages (keep your current map) */}
            {messagesAsc.map((msg) => {
              const isOwn =
                currentUserId != null
                  ? msg.user_from === currentUserId
                  : !(msg.user_from === selectedUserId);
              const align = isOwn ? "justify-end" : "justify-start";
              const canModify =
                canModifyMessage(msg) && isOwn && !msg.is_deleted;
              const isEdited =
                msg.edit_history_display?.length > 0 || msg.is_edited;
              const time = formatTime(msg.timestamp);

              return (
                <div key={msg.id} className={`flex ${align} group`}>
                  <div
                    className={`relative max-w-[75%] transition-all duration-200`}
                  >
                    <div
                      className={`relative rounded-2xl px-2 py-3 shadow-sm ${
                        isOwn
                          ? "bg-[var(--color-primary)] text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      {menuOpenForId === msg.id && canModify && (
                        <div className="absolute right-0 top-8 z-50 w-36 rounded-lg border border-gray-200 bg-white shadow-lg">
                          <button
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#e8f2ef] hover:text-[var(--color-primary)] transition-colors rounded-t-lg flex items-center gap-2"
                            onClick={() => startEdit(msg)}
                          >
                            ✏️ {t("chat.edit")}
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-b-lg flex items-center gap-2"
                            onClick={() => handleDelete(msg.id)}
                          >
                            ✕ {t("chat.delete")}
                          </button>
                        </div>
                      )}

                      {editingId === msg.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary)] disabled:opacity-60"
                              onClick={saveEdit}
                              disabled={updating || !editingText.trim()}
                            >
                              {updating ? t("chat.saving") : t("chat.save")}
                            </button>
                            <button
                              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
                              onClick={() => {
                                setEditingId(null);
                                setEditingText("");
                              }}
                            >
                              {t("chat.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.is_deleted ? (
                            <div
                              className={`italic text-sm ${
                                isOwn ? "text-white/60" : "text-gray-500"
                              }`}
                            >
                              {t("chat.thisMessageWasDeleted")}
                            </div>
                          ) : (
                            <div className="text-sm break-words">
                              <div className="flex justify-between items-center">
                                <span>{msg.message}</span>
                                {isOwn && canModify && !msg.is_deleted && (
                                  <button
                                    type="button"
                                    className={`w-6 h-6 rounded-full opacity-70 hover:opacity-100 ${
                                      isOwn
                                        ? "bg-white/30 text-white"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openMenu(msg.id);
                                    }}
                                    title={t("chat.moreOptions")}
                                    aria-label={t("chat.moreOptions")}
                                  >
                                    ⋮
                                  </button>
                                )}
                              </div>

                              {isEdited && (
                                <span
                                  className={`ml-2 text-xs italic ${
                                    isOwn ? "text-white/60" : "text-gray-500"
                                  }`}
                                >
                                  {t("chat.edited")}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <div
                        className={`mt-2 flex items-center gap-2 text-xs ${
                          isOwn ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        <span>{time}</span>
                        {msg.seen_status?.is_seen && isOwn && <span>· ✓✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!threadFetching && messages.length === 0 && selectedUserId && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-gray-500 font-medium">
                  {t("chat.noMessagesYet")}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {t("chat.startConversation")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        {selectedUserId && (
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  ref={composeInputRef} // NEW
                  type="text"
                  className="w-full px-4 py-3 pr-12 rounded-2xl border-gray-200 bg-gray-50 border-0 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent focus:bg-white placeholder-gray-500 transition-all duration-200"
                  placeholder={t("chat.typeYourMessage")}
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                {compose && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)] hover:scale-110 transition-all duration-200 shadow-md flex items-center justify-center"
                    onClick={handleSend}
                    disabled={sending || !compose.trim()}
                    title={t("chat.sendMessage")}
                  >
                    {sending ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-sm">→</span>
                    )}
                  </button>
                )}
              </div>
              {!compose && (
                <button
                  className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-2xl font-medium hover:bg-[var(--color-primary)] hover:shadow-md transition-all duration-200 disabled:opacity-60"
                  onClick={handleSend}
                  disabled={sending || !compose.trim() || !selectedUserId}
                  title={
                    !selectedUserId
                      ? t("chat.selectParticipantFirst")
                      : t("chat.sendMessage")
                  }
                >
                  {t("chat.send")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal (NEW) */}
      {showNewChat && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowNewChat(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {t("chat.startNewChatTitle")}
              </h3>
              <button
                className="w-8 h-8 rounded-full hover:bg-gray-100"
                onClick={() => setShowNewChat(false)}
                aria-label={t("chat.close")}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder={t("chat.searchUsers")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="px-4 pb-4 max-h-96 overflow-y-auto">
              {usersLoading && (
                <div className="p-4 text-sm text-gray-500">
                  {t("chat.loadingUsers")}
                </div>
              )}
              {usersError && (
                <div className="p-4 text-sm text-red-600">
                  {t("chat.failedToLoadUsers")}
                </div>
              )}
              {!usersLoading && filteredUsers.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  {t("chat.noUsersFound")}
                </div>
              )}

              <ul className="space-y-2">
                {filteredUsers.map((u) => {
                  const alreadyInThisTransaction = participantSet.has(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        onClick={() => startChatWithUser(u)}
                      >
                        <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold text-sm">
                          {(u.username || `${t("chat.user")} ${u.id}`)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium capitalize">
                            {u.username || `${t("chat.user")} ${u.id}`}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {u.user_level}
                          </div>
                        </div>
                        {alreadyInThisTransaction && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border text-gray-600">
                            {t("chat.existingChat")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-3 border-t flex justify-end">
              <button
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                onClick={() => setShowNewChat(false)}
              >
                {t("chat.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
