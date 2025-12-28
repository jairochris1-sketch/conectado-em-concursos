
import { useState, useEffect } from 'react';
import { Comment } from '@/entities/Comment';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp, Flag, Send, MessageCircle, MapPin, Trash2, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ReportModal from './ReportModal'; // Importar o novo modal de reporte

export default function CommentSection({ questionId, onCommentChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [reportModal, setReportModal] = useState({ isOpen: false, comment: null }); // Novo estado para o modal de reporte
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null); // New state for delete confirmation

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const commentsData = await Comment.filter({ question_id: questionId });
        setComments(commentsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        const user = await User.me();
        setCurrentUser(user);
        if (onCommentChange) {
          onCommentChange();
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
      setIsLoading(false);
    };

    loadData();
  }, [questionId, onCommentChange]); // Add onCommentChange to dependency array

  const loadComments = async () => {
    try {
      const commentsData = await Comment.filter({ question_id: questionId });
      setComments(commentsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      if (onCommentChange) {
        onCommentChange();
      }
    } catch (error) {
      console.error('Erro ao recarregar comentários:', error);
    }
  };

  const handleSubmitComment = async () => {
    // Basic check to prevent submitting empty comments (after stripping HTML)
    if (!newComment.replace(/<(.|\n)*?>/g, '').trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Comment.create({
        question_id: questionId,
        comment_text: newComment, // Save full HTML content
        user_name: currentUser.full_name || currentUser.email,
        user_email: currentUser.email,
        user_city: currentUser.city || null,
        // Assuming user_photo will be available from currentUser or handled by Comment.create
        user_photo: currentUser.profile_photo_url || null,
      });

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      alert('Erro ao enviar comentário. Tente novamente.');
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId) => {
    if (!currentUser) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      const userHasLiked = comment.liked_by_users?.includes(currentUser.email) || false;

      let updatedLikedUsers;
      let updatedLikesCount;

      if (userHasLiked) {
        updatedLikedUsers = (comment.liked_by_users || []).filter(email => email !== currentUser.email);
        updatedLikesCount = Math.max(0, (comment.likes_count || 0) - 1);
      } else {
        updatedLikedUsers = [...(comment.liked_by_users || []), currentUser.email];
        updatedLikesCount = (comment.likes_count || 0) + 1;
      }

      await Comment.update(commentId, {
        liked_by_users: updatedLikedUsers,
        likes_count: updatedLikesCount
      });

      loadComments();
    } catch (error) {
      console.error('Erro ao curtir comentário:', error);
    }
  };

  const handleReport = (comment) => {
    if (!currentUser) return; // Ensure user is logged in to report
    setReportModal({ isOpen: true, comment });
  };

  const handleReportSuccess = async () => {
    try {
      // Marcar o comentário como reportado no banco de dados
      await Comment.update(reportModal.comment.id, { is_reported: true });
      alert('Comentário reportado com sucesso. A equipe revisará o conteúdo.');
      loadComments(); // Recarregar os comentários para refletir a mudança, se necessário
    } catch (error) {
      console.error('Erro ao marcar comentário como reportado:', error);
      alert('Erro ao marcar o comentário como reportado no sistema.');
    } finally {
      setReportModal({ isOpen: false, comment: null }); // Fechar o modal
    }
  };

  const handleDeleteRequest = (commentId) => {
    if (!currentUser) return;
    setConfirmDeleteModal(commentId);
  };

  const executeDelete = async () => {
    if (!confirmDeleteModal) return;
    try {
      await Comment.delete(confirmDeleteModal);
      // alert('Comentário excluído com sucesso.'); // Removed as per request to avoid double alert (modal + this)
      await loadComments();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário.');
    } finally {
      setConfirmDeleteModal(null);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment_text); // Load full HTML content for editing
  };

  const handleSaveEdit = async (commentId) => {
    // Basic check to prevent submitting empty edits (after stripping HTML)
    if (!editText.replace(/<(.|\n)*?>/g, '').trim()) return;

    try {
      await Comment.update(commentId, {
        comment_text: editText // Save full HTML content
      });

      setEditingComment(null);
      setEditText('');
      loadComments();
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário.');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const getTimeAgo = (dateString) => {
    try {
      // Criar a data assumindo que está em UTC e converter para o fuso local
      const date = new Date(dateString);
      const now = new Date();
      
      // Calcular diferença em minutos
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'agora';
      } else if (diffInMinutes < 60) {
        return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
      } else {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
      }
    } catch (error) {
      console.error('Erro ao calcular tempo:', error);
      return 'há pouco tempo';
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <p className="text-gray-500">Carregando comentários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Comentários ({comments.length})</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <ReactQuill
              theme="snow"
              value={newComment}
              onChange={setNewComment}
              placeholder="Adicione um comentário sobre esta questão..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline','strike', 'blockquote'],
                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                  ['link'],
                  ['clean']
                ],
              }}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.replace(/<(.|\n)*?>/g, '').trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Comentar
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Seja o primeiro a comentar esta questão!
              </p>
            ) : (
              comments.map((comment) => {
                const isOwnComment = currentUser && comment.user_email === currentUser.email;
                const userHasLiked = comment.liked_by_users?.includes(currentUser?.email) || false;

                return (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        {/* Use comment.user_photo if available, otherwise fallback */}
                        {comment.user_photo ? (
                          <AvatarImage src={comment.user_photo} alt={comment.user_name} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                          {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.user_name}
                          </span>
                          {comment.user_city && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span>{comment.user_city}</span>
                              </div>
                            </>
                          )}
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(comment.created_date)}
                          </span>

                          {/* Botões de ação para o autor do comentário */}
                          {isOwnComment && (
                            <div className="flex items-center gap-1 ml-auto">
                              {editingComment !== comment.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(comment)}
                                  className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRequest(comment.id)}
                                className="h-6 px-2 text-xs text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Modo de edição */}
                        {editingComment === comment.id ? (
                          <div className="space-y-2 mb-3">
                            <ReactQuill
                              theme="snow"
                              value={editText}
                              onChange={setEditText}
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}],
                                  ['clean']
                                ],
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={!editText.replace(/<(.|\n)*?>/g, '').trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none text-gray-800 mb-3 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: comment.comment_text }}
                          />
                        )}

                        {/* Botões de ação (só mostra se não estiver editando) */}
                        {editingComment !== comment.id && (
                          <div className="flex items-center gap-4 text-sm">
                            {/* Gostei - sempre visível, mas clicável apenas se não for o próprio comentário */}
                            <button
                              onClick={() => !isOwnComment && handleLike(comment.id)}
                              className={`flex items-center gap-1 transition-colors ${
                                isOwnComment
                                  ? 'text-gray-500 cursor-default' // Disabled appearance for own comments
                                  : userHasLiked
                                    ? 'text-blue-600 hover:text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700'
                              }`}
                              disabled={isOwnComment}
                            >
                              <ThumbsUp className={`w-4 h-4 ${userHasLiked ? 'fill-current' : ''}`} />
                              Gostei ({comment.likes_count || 0})
                            </button>

                            {/* Reportar abuso - só aparece se não for o próprio comentário */}
                            {!isOwnComment && (
                              <button
                                onClick={() => handleReport(comment)}
                                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <Flag className="w-4 h-4" />
                                Reportar abuso
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Renderiza o ReportModal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, comment: null })}
        comment={reportModal.comment}
        currentUser={currentUser}
        onReportSuccess={handleReportSuccess}
      />

      {/* NEW: Delete Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all scale-100 opacity-100">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Excluir Comentário
                </h3>
                <p className="text-md text-gray-600 dark:text-gray-400 mt-2">
                  Você tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
                </p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteModal(null)}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={executeDelete}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
