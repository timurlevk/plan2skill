'use client';

import React, { useState, useCallback } from 'react';
import { t } from '../../(onboarding)/_components/tokens';
import type { EpisodeReviewItem, EpisodeStatus } from '@plan2skill/types';
import { trpc } from '@plan2skill/api-client';

// ═══════════════════════════════════════════
// ADMIN: NARRATIVE REVIEW — Episode moderation
// NOT gamified (admin layout = plain components)
// Table view: episode list, approve/edit/reject, generate batch
// ═══════════════════════════════════════════

type StatusFilter = EpisodeStatus | 'all';

export default function AdminNarrativePage() {
  const utils = trpc.useUtils();
  const { data: episodesData } = trpc.narrative.reviewQueue.useQuery();
  const episodes = episodesData ?? [];

  const reviewMutation = trpc.narrative.review.useMutation({
    onSuccess: () => { utils.narrative.reviewQueue.invalidate(); },
  });
  const generateMutation = trpc.narrative.generateBatch.useMutation({
    onSuccess: () => { utils.narrative.reviewQueue.invalidate(); },
  });

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editReflection, setEditReflection] = useState('');
  const [seasonId, setSeasonId] = useState('');

  // Filter episodes
  const filtered = filter === 'all'
    ? episodes
    : episodes.filter((ep) => ep.status === filter);

  // Start editing
  const startEdit = useCallback((ep: EpisodeReviewItem) => {
    setEditingId(ep.id);
    setEditTitle(ep.title);
    setEditBody(ep.body);
    setEditReflection(ep.sageReflection);
  }, []);

  // Handle approve (with optional edits)
  const handleApprove = useCallback((episodeId: string) => {
    const edits = editingId === episodeId
      ? { title: editTitle, body: editBody, sageReflection: editReflection }
      : undefined;

    reviewMutation.mutate({ episodeId, action: 'approve', edits });
    setEditingId(null);
  }, [editingId, editTitle, editBody, editReflection, reviewMutation]);

  // Handle reject
  const handleReject = useCallback((episodeId: string) => {
    reviewMutation.mutate({ episodeId, action: 'reject' });
  }, [reviewMutation]);

  // Generate batch
  const handleGenerate = useCallback(() => {
    if (!seasonId.trim()) return;
    generateMutation.mutate({ seasonId, count: 7 });
  }, [seasonId, generateMutation]);

  const statusColors: Record<string, string> = {
    draft: t.gold,
    reviewed: t.cyan,
    published: t.mint,
    scheduled: t.indigo,
    archived: t.textMuted,
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontFamily: t.display,
            fontSize: 20,
            fontWeight: 700,
            color: t.text,
            margin: '0 0 4px',
          }}>
            Narrative Episodes
          </h1>
          <p style={{
            fontFamily: t.body,
            fontSize: 13,
            color: t.textMuted,
            margin: 0,
          }}>
            Review AI-generated episodes, approve or reject, generate new batches.
          </p>
        </div>

        {/* Generate Batch */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Season UUID"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            style={{
              background: t.bgElevated,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: t.mono,
              fontSize: 12,
              color: t.text,
              width: 200,
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !seasonId.trim()}
            style={{
              background: t.violet,
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: generateMutation.isPending ? 'wait' : 'pointer',
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 600,
              color: '#FFF',
              opacity: generateMutation.isPending || !seasonId.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate 7 Episodes'}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
      }}>
        {(['all', 'draft', 'reviewed', 'published', 'archived'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? `${t.violet}15` : 'transparent',
              border: `1px solid ${filter === f ? t.violet : t.border}`,
              borderRadius: 6,
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: t.body,
              fontSize: 12,
              fontWeight: filter === f ? 600 : 400,
              color: filter === f ? t.text : t.textMuted,
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 20,
      }}>
        {[
          { label: 'Draft', count: episodes.filter((e) => e.status === 'draft').length, color: t.gold },
          { label: 'Reviewed', count: episodes.filter((e) => e.status === 'reviewed').length, color: t.cyan },
          { label: 'Published', count: episodes.filter((e) => e.status === 'published').length, color: t.mint },
          { label: 'Total', count: episodes.length, color: t.textMuted },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            fontFamily: t.mono,
            fontSize: 11,
            color,
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, display: 'block' }}>{count}</span>
            {label}
          </div>
        ))}
      </div>

      {/* Episodes Table */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: t.bgCard,
          borderRadius: 12,
          border: `1px solid ${t.border}`,
        }}>
          <p style={{
            fontFamily: t.body,
            fontSize: 14,
            color: t.textMuted,
          }}>
            No episodes in queue. Use &ldquo;Generate 7 Episodes&rdquo; to create a batch.
          </p>
        </div>
      ) : (
        <div style={{
          background: t.bgCard,
          borderRadius: 12,
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 80px 80px 80px 140px',
            gap: 8,
            padding: '10px 16px',
            borderBottom: `1px solid ${t.border}`,
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 700,
            color: t.textMuted,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <div>Ep #</div>
            <div>Title</div>
            <div>Words</div>
            <div>Category</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Table rows */}
          {filtered.map((ep) => (
            <div key={ep.id}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px 80px 80px 140px',
                gap: 8,
                padding: '12px 16px',
                borderBottom: `1px solid ${t.border}08`,
                alignItems: 'center',
              }}>
                <div style={{ fontFamily: t.mono, fontSize: 12, color: t.textSecondary }}>
                  {ep.globalNumber}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ep.title}
                </div>
                <div style={{ fontFamily: t.mono, fontSize: 12, color: t.textMuted }}>
                  {ep.wordCount}
                </div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.textMuted, textTransform: 'capitalize' }}>
                  {ep.category}
                </div>
                <div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 4,
                    color: statusColors[ep.status] || t.textMuted,
                    background: `${statusColors[ep.status] || t.textMuted}12`,
                    textTransform: 'capitalize',
                  }}>
                    {ep.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ep.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleApprove(ep.id)}
                        style={{
                          background: `${t.mint}15`, border: `1px solid ${t.mint}30`,
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                          fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.mint,
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => startEdit(ep)}
                        style={{
                          background: `${t.cyan}15`, border: `1px solid ${t.cyan}30`,
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                          fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.cyan,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleReject(ep.id)}
                        style={{
                          background: `${t.rose}15`, border: `1px solid ${t.rose}30`,
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                          fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.rose,
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {ep.status === 'reviewed' && (
                    <span style={{
                      fontFamily: t.body, fontSize: 11, color: t.textMuted,
                    }}>
                      Ready to publish
                    </span>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === ep.id && (
                <div style={{
                  padding: '16px',
                  background: t.bgElevated,
                  borderBottom: `1px solid ${t.border}`,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{
                        fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                        color: t.textMuted, display: 'block', marginBottom: 4,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          width: '100%',
                          background: t.bg,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontFamily: t.body,
                          fontSize: 13,
                          color: t.text,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                        color: t.textMuted, display: 'block', marginBottom: 4,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Body
                      </label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={6}
                        style={{
                          width: '100%',
                          background: t.bg,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontFamily: t.body,
                          fontSize: 13,
                          color: t.text,
                          resize: 'vertical',
                          lineHeight: 1.6,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                        color: t.textMuted, display: 'block', marginBottom: 4,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Sage Reflection
                      </label>
                      <textarea
                        value={editReflection}
                        onChange={(e) => setEditReflection(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          background: t.bg,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontFamily: t.body,
                          fontSize: 13,
                          color: t.text,
                          fontStyle: 'italic',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleApprove(ep.id)}
                        style={{
                          background: t.mint, border: 'none', borderRadius: 8,
                          padding: '8px 16px', cursor: 'pointer',
                          fontFamily: t.body, fontSize: 13, fontWeight: 600, color: '#000',
                        }}
                      >
                        Save &amp; Approve
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          background: 'none', border: `1px solid ${t.border}`, borderRadius: 8,
                          padding: '8px 16px', cursor: 'pointer',
                          fontFamily: t.body, fontSize: 13, color: t.textMuted,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI confidence indicator */}
              {ep.aiConfidence !== null && ep.status === 'draft' && (
                <div style={{
                  padding: '4px 16px 8px',
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.textMuted,
                }}>
                  AI: {ep.aiModelUsed} &middot; Confidence: {Math.round((ep.aiConfidence || 0) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
