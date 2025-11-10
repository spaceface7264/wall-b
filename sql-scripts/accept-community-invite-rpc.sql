-- ============================================
-- Accept Community Invite RPC Function
-- ============================================
-- This function allows users to accept invites to private communities
-- by automatically approving their join request and adding them as members
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION accept_community_invite(
  p_community_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_result JSONB;
BEGIN
  -- Check if user is authenticated
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Check if there's an existing pending request
  SELECT id INTO v_request_id
  FROM community_join_requests
  WHERE community_id = p_community_id
    AND user_id = p_user_id
    AND status = 'pending'
  LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    -- Update existing request to approved
    UPDATE community_join_requests
    SET status = 'approved',
        responded_at = NOW(),
        responded_by = p_user_id
    WHERE id = v_request_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to update join request'
      );
    END IF;
  ELSE
    -- Create approved request directly
    INSERT INTO community_join_requests (
      community_id,
      user_id,
      status,
      responded_at,
      responded_by
    )
    VALUES (
      p_community_id,
      p_user_id,
      'approved',
      NOW(),
      p_user_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_request_id;

    -- If still no request_id, it might already exist as approved
    IF v_request_id IS NULL THEN
      SELECT id INTO v_request_id
      FROM community_join_requests
      WHERE community_id = p_community_id
        AND user_id = p_user_id
        AND status = 'approved'
      LIMIT 1;
    END IF;
  END IF;

  -- Add user to community members (ignore if already exists)
  INSERT INTO community_members (
    community_id,
    user_id,
    role
  )
  VALUES (
    p_community_id,
    p_user_id,
    'member'
  )
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Invite accepted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_community_invite(UUID, UUID) TO authenticated;

