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
import ReportModal from './ReportModal';
import { useQuestionLimit } from '../hooks/useQuestionLimit';
import { StaffBadge } from "@/components/ui/staff-badge";

export default function CommentSection({ questionId, onCommentChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [reportModal, setReportModal] = useState({ isOpen: false, comment: null });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);

  const { isCommentingBlocked } = useQuestionLimit();

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
  }, [questionId, onCommentChange]);

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
    if (!newComment.replace(/<(.|\n)*?>/g, '').trim() || !currentUser || isSubmitting || isCommentingBlocked) return;

    setIsSubmitting(true);
    try {
      await Comment.create({
        question_id: questionId,
        comment_text: newComment,
        user_name: currentUser.full_name || currentUser.email,
        user_email: currentUser.email,
        user_city: currentUser.city || null,
        user_photo: currentUser.profile_photo_url || null
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
      const comment = comments.find((c) => c.id === commentId);
      const userHasLiked = comment.liked_by_users?.includes(currentUser.email) || false;

      let updatedLikedUsers;
      let updatedLikesCount;

      if (userHasLiked) {
        updatedLikedUsers = (comment.liked_by_users || []).filter((email) => email !== currentUser.email);
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
    if (!currentUser) return;
    setReportModal({ isOpen: true, comment });
  };

  const handleReportSuccess = async () => {
    try {
      await Comment.update(reportModal.comment.id, { is_reported: true });
      alert('Comentário reportado com sucesso. A equipe revisará o conteúdo.');
      loadComments();
    } catch (error) {
      console.error('Erro ao marcar comentário como reportado:', error);
      alert('Erro ao marcar o comentário como reportado no sistema.');
    } finally {
      setReportModal({ isOpen: false, comment: null });
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
    setEditText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.replace(/<(.|\n)*?>/g, '').trim()) return;

    try {
      await Comment.update(commentId, {
        comment_text: editText
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
      const date = new Date(dateString);
      const now = new Date();

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
      </Card>);

  }

  return (
    <>
      <Card className="bg-card text-card-foreground mt-6 rounded border shadow">
        <CardHeader className="bg-slate-800 p-6 rounded-none flex flex-col space-y-1.5">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="text-slate-200 text-lg font-semibold">Comentários ({comments.length})</h3>
          </div>
        </CardHeader>
        <CardContent className="bg-slate-300 pt-0 p-6 space-y-6">
          {isCommentingBlocked ?
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm">Você atingiu o limite diário de 20 questões para o plano gratuito. Assine para continuar respondendo e comentando!</p>
            </div> :

          <div className="space-y-3">
              <ReactQuill
              theme="snow"
              value={newComment}
              onChange={setNewComment}
              placeholder="Adicione um comentário sobre esta questão..."
              modules={{
                toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                ['link'],
                ['clean']]

              }} />

              <div className="flex justify-end">
                <Button
                onClick={handleSubmitComment}
                disabled={!newComment.replace(/<(.|\n)*?>/g, '').trim() || isSubmitting} className="bg-blue-600 text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-blue-700">


                  {isSubmitting ? 'Enviando...' :
                <>
                      <Send className="w-4 h-4 mr-2" />
                      Comentar
                    </>
                }
                </Button>
              </div>
            </div>
          }

          <div className="space-y-4">
            {comments.length === 0 ?
            <p className="text-gray-500 text-center py-8">
                Seja o primeiro a comentar esta questão!
              </p> :

            comments.map((comment) => {
              const isOwnComment = currentUser && comment.user_email === currentUser.email;
              const userHasLiked = comment.liked_by_users?.includes(currentUser?.email) || false;

              return (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        {comment.user_photo ?
                      <AvatarImage src={comment.user_photo} alt={comment.user_name} /> :
                      null}
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                          {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-200 font-medium">
                            {comment.user_name}
                          </span>
                          <StaffBadge email={comment.user_email} />
                          {comment.user_city &&
                        <>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span className="text-slate-200">{comment.user_city}</span>
                              </div>
                            </>
                        }
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(comment.created_date)}
                          </span>

                          {isOwnComment &&
                        <div className="flex items-center gap-1 ml-auto">
                              {editingComment !== comment.id &&
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(comment)}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600">

                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                          }
                              <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(comment.id)}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-red-600">

                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                        }
                        </div>

                        {editingComment === comment.id ?
                      <div className="space-y-2 mb-3">
                            <ReactQuill
                          theme="snow"
                          value={editText}
                          onChange={setEditText}
                          modules={{
                            toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['clean']]

                          }} />

                            <div className="flex items-center gap-2">
                              <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editText.replace(/<(.|\n)*?>/g, '').trim()}
                            className="bg-green-600 hover:bg-green-700">

                                <Check className="w-4 h-4 mr-1" />
                                Salvar
                              </Button>
                              <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}>

                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div> :

                      <div
                        className="prose prose-sm max-w-none text-gray-800 mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: comment.comment_text }} />

                      }

                        {editingComment !== comment.id &&
                      <div className="flex items-center gap-4 text-sm">
                            <button
                          onClick={() => !isOwnComment && handleLike(comment.id)}
                          className={`flex items-center gap-1 transition-colors ${
                          isOwnComment ?
                          'text-gray-500 cursor-default' :
                          userHasLiked ?
                          'text-blue-600 hover:text-blue-700' :
                          'text-gray-500 hover:text-gray-700'}`
                          }
                          disabled={isOwnComment}>

                              <ThumbsUp className={`w-4 h-4 ${userHasLiked ? 'fill-current' : ''}`} />
                              Gostei ({comment.likes_count || 0})
                            </button>

                            {!isOwnComment &&
                        <button
                          onClick={() => handleReport(comment)}
                          className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">

                                <Flag className="w-4 h-4" />
                                Reportar abuso
                              </button>
                        }
                          </div>
                      }
                      </div>
                    </div>
                  </div>);

            })
            }
          </div>
        </CardContent>
      </Card>

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, comment: null })}
        comment={reportModal.comment}
        currentUser={currentUser}
        onReportSuccess={handleReportSuccess} />


      {confirmDeleteModal &&
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
              className="w-full">

                Cancelar
              </Button>
              <Button
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 text-white w-full">

                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      }
    </>);

}