import React from 'react';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Box, Alert, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import DraggableRuleItem from './DraggableRuleItem';
import { AudienceRule } from '../../utils/api';

interface FieldOption {
  value: string;
  label: string;
  type: string;
}

interface OperatorOption {
  value: string;
  label: string;
}

interface OperatorOptions {
  [key: string]: OperatorOption[];
}

interface DroppableRuleListProps {
  rules: AudienceRule[];
  fieldOptions: FieldOption[];
  operatorOptions: OperatorOptions;
  updateRule: (index: number, field: keyof AudienceRule, value: any) => void;
  removeRule: (index: number) => void;
  addRule: () => void;
  validationError: boolean;
  validationMessage?: string;
}

const DroppableRuleList: React.FC<DroppableRuleListProps> = ({
  rules,
  fieldOptions,
  operatorOptions,
  updateRule,
  removeRule,
  addRule,
  validationError,
  validationMessage,
}) => {
  return (
    <Box>
      <Droppable droppableId="rules-list">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps as any}
          >
            {rules.map((rule, index) => (
              <DraggableRuleItem
                key={index}
                rule={rule}
                index={index}
                isFirst={index === 0}
                fieldOptions={fieldOptions}
                operatorOptions={operatorOptions}
                updateRule={updateRule}
                removeRule={removeRule}
                validationError={validationError}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {validationError && rules.length === 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationMessage || 'Please add at least one audience rule'}
        </Alert>
      )}

      <Button
        startIcon={<Add />}
        onClick={addRule}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Add Rule
      </Button>
    </Box>
  );
};

export default DroppableRuleList;