import React, { useState, useEffect, useCallback } from 'react';
import { Comment, UserRole } from '../types';
import * as api from '../services/supabaseApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { Spinner } from './Spinner';

interface CommentSectionProps {
    forecastId: number;
    isVisible: boolean;
    onCommentChange: () => void;
}

const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('it-IT');
};


const CommentSection: React.FC<CommentSectionProps> = ({ forecastId, isVisible, onCommentChange }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<{ id: number; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCommentsByForecastId(forecastId);
            setComments(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) {
            addToast('Failed to load comments', 'error');
        } finally {
            setLoading(false);
        }
    }, [forecastId, addToast]);

    useEffect(() => {
        if (isVisible) {
            fetchComments();
        }
    }, [isVisible, fetchComments]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setPosting(true);
        try {
            await api.addComment(forecastId, newComment, user.id, user.name);
            setNewComment('');
            addToast('Comment added', 'success');
            fetchComments(); // Re-fetch to get the latest comments
            onCommentChange();
        } catch (error) {
            addToast('Failed to add comment', 'error');
        } finally {
            setPosting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingComment) return;
        try {
            await api.updateComment(editingComment.id, editingComment.text);
            addToast('Comment updated', 'success');
            setEditingComment(null);
            fetchComments();
            onCommentChange();
        } catch (error) {
            addToast('Failed to update comment', 'error');
        }
    };
    
    const handleDeleteComment = async (commentId: number) => {
        try {
            await api.deleteComment(commentId);
            addToast('Comment deleted', 'success');
            fetchComments();
            onCommentChange();
        } catch (error) {
            addToast('Failed to delete comment', 'error');
        }
    };
    
    if (!isVisible) return null;

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Comments</h4>
            
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-grow p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={posting}
                />
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                    disabled={posting || !newComment.trim()}
                >
                    {posting ? <Spinner className="h-4 w-4" /> : 'Post'}
                </button>
            </form>

            {/* Comments List */}
            {loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading comments...</p>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {comments.length > 0 ? comments.map(comment => {
                        const canEdit = user?.id === comment.userId;
                        const canDelete = canEdit || user?.role === UserRole.Admin;
                        const isEditing = editingComment?.id === comment.id;

                        return (
                            <div key={comment.id} className="text-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{comment.userName}</span>
                                        <span className="text-slate-400 ml-2 text-xs">{formatRelativeTime(comment.timestamp)}</span>
                                    </div>
                                    { (canEdit || canDelete) && !isEditing && (
                                        <div className="flex items-center space-x-1">
                                            {canEdit && <button onClick={() => setEditingComment({ id: comment.id, text: comment.text })} className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full"><PencilIcon className="h-3.5 w-3.5"/></button>}
                                            {canDelete && <button onClick={() => handleDeleteComment(comment.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-full"><TrashIcon className="h-3.5 w-3.5"/></button>}
                                        </div>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={editingComment.text}
                                            onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                            className="flex-grow p-1 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 w-full"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateComment} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckCircleIcon className="h-5 w-5"/></button>

                                        <button onClick={() => setEditingComment(null)} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full"><XCircleIcon className="h-5 w-5"/></button>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{comment.text}</p>
                                )}
                            </div>
                        )
                    }) : (
                        <p className="text-sm text-slate-400">No comments yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentSection;