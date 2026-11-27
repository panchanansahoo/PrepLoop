export async function deleteSavedInterview(client, userId, id) {
  const rawId = String(id || '').trim();
  if (!rawId) {
    throw new Error('Invalid interview ID');
  }
  const cleanId = rawId.replace(/^(interview_session_|mock_interview_)/, '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  const numericId = Number(cleanId);
  if (/^[1-9][0-9]*$/.test(cleanId) && numericId <= 2147483647) {
    const { error } = await client.from('mock_interviews').delete().eq('user_id', userId).eq('id', numericId);
    if (error) throw error;
    return;
  }

  let query = client.from('interview_sessions').delete().eq('user_id', userId);
  if (isUuid) {
    query = query.or(`id.eq.${cleanId},session_id.eq.${cleanId}`);
  } else if (cleanId === rawId) {
    query = query.eq('session_id', cleanId);
  } else {
    query = query.in('session_id', [cleanId, rawId]);
  }
  const { error } = await query;
  if (error) throw error;
}
