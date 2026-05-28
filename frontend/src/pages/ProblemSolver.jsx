import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

// Temporary compatibility page: redirect legacy /problems/:id to the code editor
export default function ProblemSolver() {
  const { id } = useParams();
  if (!id) return <Navigate to="/problems" replace />;
  return <Navigate to={`/dsa-editor/${id}`} replace />;
}
