import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Tag,
  MessageSquare,
  Clock,
  FileText,
  Heart
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import type { MessageTemplate } from '@/types';

const CATEGORIES = [
  { id: 'all', name: 'Todas', icon: MessageSquare },
  { id: 'reminder', name: 'Recordatorios', icon: Clock },
  { id: 'confirmation', name: 'Confirmaciones', icon: FileText },
  { id: 'consent', name: 'Consentimientos', icon: FileText },
  { id: 'general', name: 'General', icon: Heart },
];

export default function TemplatesScreen() {
  const { templates, updateTemplates } = useClinic();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setShowAddModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setShowAddModal(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      'Eliminar Plantilla',
      '¿Estás seguro de que quieres eliminar esta plantilla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedTemplates = templates.filter(t => t.id !== templateId);
            updateTemplates(updatedTemplates);
          }
        }
      ]
    );
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    // In a real app, this would copy to clipboard
    Alert.alert('Copiado', 'Plantilla copiada al portapapeles');
  };

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <item.icon 
        color={selectedCategory === item.id ? Colors.light.surface : Colors.light.primary} 
        size={16} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderTemplateItem = ({ item }: { item: MessageTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => {
        setSelectedTemplate(item);
        setShowTemplateModal(true);
      }}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <Text style={styles.templateName}>{item.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
              {getCategoryName(item.category)}
            </Text>
          </View>
        </View>
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={styles.templateAction}
            onPress={() => handleCopyTemplate(item)}
          >
            <Copy color={Colors.light.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateAction}
            onPress={() => handleEditTemplate(item)}
          >
            <Edit color={Colors.light.primary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateAction}
            onPress={() => handleDeleteTemplate(item.id)}
          >
            <Trash2 color={Colors.light.error} size={16} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.templateContent} numberOfLines={3}>
        {item.content}
      </Text>
      
      {item.variables.length > 0 && (
        <View style={styles.variablesContainer}>
          <Text style={styles.variablesLabel}>Variables:</Text>
          <View style={styles.variablesList}>
            {item.variables.map((variable, index) => (
              <View key={index} style={styles.variableTag}>
                <Text style={styles.variableText}>{variable}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{templates.length}</Text>
        <Text style={styles.statLabel}>Total Plantillas</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {templates.filter(t => t.category === 'reminder').length}
        </Text>
        <Text style={styles.statLabel}>Recordatorios</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {templates.filter(t => t.category === 'confirmation').length}
        </Text>
        <Text style={styles.statLabel}>Confirmaciones</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plantillas de Mensajes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTemplate}>
          <Plus color={Colors.light.surface} size={20} />
        </TouchableOpacity>
      </View>

      {renderStats()}

      <View style={styles.searchContainer}>
        <Search color={Colors.light.textSecondary} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar plantillas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContent}
      />

      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id}
        style={styles.templatesList}
        contentContainerStyle={styles.templatesListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageSquare color={Colors.light.textSecondary} size={48} />
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No se encontraron plantillas' 
                : 'No hay plantillas creadas'}
            </Text>
          </View>
        }
      />

      {/* Add/Edit Template Modal */}
      <TemplateModal
        visible={showAddModal}
        template={selectedTemplate}
        onClose={() => {
          setShowAddModal(false);
          setSelectedTemplate(null);
        }}
        onSave={(template) => {
          if (selectedTemplate) {
            // Edit existing template
            const updatedTemplates = templates.map(t => 
              t.id === template.id ? template : t
            );
            updateTemplates(updatedTemplates);
          } else {
            // Add new template
            updateTemplates([...templates, template]);
          }
          setShowAddModal(false);
          setSelectedTemplate(null);
        }}
      />

      {/* Template Detail Modal */}
      <TemplateDetailModal
        visible={showTemplateModal}
        template={selectedTemplate}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
        }}
        onEdit={() => {
          setShowTemplateModal(false);
          setShowAddModal(true);
        }}
      />
    </SafeAreaView>
  );
}

// Template Modal Component
function TemplateModal({ 
  visible, 
  template, 
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  template: MessageTemplate | null; 
  onClose: () => void; 
  onSave: (template: MessageTemplate) => void; 
}) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MessageTemplate['category']>('general');
  const [variables, setVariables] = useState<string[]>([]);

  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
      setCategory(template.category);
      setVariables(template.variables);
    } else {
      setName('');
      setContent('');
      setCategory('general');
      setVariables([]);
    }
  }, [template]);

  React.useEffect(() => {
    // Extract variables from content
    const matches = content.match(/\{([^}]+)\}/g);
    if (matches) {
      const extractedVars = matches.map(match => match.slice(1, -1));
      setVariables([...new Set(extractedVars)]);
    } else {
      setVariables([]);
    }
  }, [content]);

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      Alert.alert('Error', 'El nombre y contenido son obligatorios');
      return;
    }

    const templateData: MessageTemplate = {
      id: template?.id || Date.now().toString(),
      name: name.trim(),
      content: content.trim(),
      category,
      variables
    };

    onSave(templateData);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la plantilla"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.categorySelector}>
              {CATEGORIES.slice(1).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categorySelectorItem,
                    category === cat.id && styles.categorySelectorItemActive
                  ]}
                  onPress={() => setCategory(cat.id as MessageTemplate['category'])}
                >
                  <cat.icon 
                    color={category === cat.id ? Colors.light.surface : Colors.light.primary} 
                    size={16} 
                  />
                  <Text style={[
                    styles.categorySelectorText,
                    category === cat.id && styles.categorySelectorTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contenido *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Escribe el contenido del mensaje..."
              multiline
              numberOfLines={6}
              placeholderTextColor={Colors.light.textSecondary}
            />
            <Text style={styles.helpText}>
              Usa {'{variable}'} para insertar variables dinámicas
            </Text>
          </View>

          {variables.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Variables Detectadas</Text>
              <View style={styles.variablesList}>
                {variables.map((variable, index) => (
                  <View key={index} style={styles.variableTag}>
                    <Text style={styles.variableText}>{variable}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ejemplo de Variables</Text>
            <Text style={styles.helpText}>
              • {'{nombre}'} - Nombre del paciente{'\n'}
              • {'{fecha}'} - Fecha de la cita{'\n'}
              • {'{hora}'} - Hora de la cita{'\n'}
              • {'{tratamiento}'} - Tipo de tratamiento{'\n'}
              • {'{clinica}'} - Nombre de la clínica
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Template Detail Modal Component
function TemplateDetailModal({ 
  visible, 
  template, 
  onClose, 
  onEdit 
}: { 
  visible: boolean; 
  template: MessageTemplate | null; 
  onClose: () => void; 
  onEdit: () => void; 
}) {
  if (!template) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cerrar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalles de Plantilla</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.modalSaveButton}>Editar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.templateDetailHeader}>
            <Text style={styles.templateDetailName}>{template.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(template.category) + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: getCategoryColor(template.category) }]}>
                {getCategoryName(template.category)}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contenido</Text>
            <View style={styles.contentPreview}>
              <Text style={styles.contentPreviewText}>{template.content}</Text>
            </View>
          </View>

          {template.variables.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Variables</Text>
              <View style={styles.variablesList}>
                {template.variables.map((variable, index) => (
                  <View key={index} style={styles.variableTag}>
                    <Text style={styles.variableText}>{variable}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'reminder': return Colors.light.warning;
    case 'confirmation': return Colors.light.success;
    case 'consent': return Colors.light.error;
    case 'general': return Colors.light.primary;
    default: return Colors.light.textSecondary;
  }
}

function getCategoryName(category: string): string {
  const cat = CATEGORIES.find(c => c.id === category);
  return cat?.name || 'General';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  categoriesList: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    gap: 6,
  },
  categoryItemActive: {
    backgroundColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.light.surface,
  },
  templatesList: {
    flex: 1,
  },
  templatesListContent: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateTitleRow: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  templateContent: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  variablesContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  variablesLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variableTag: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  variableText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalCancelButton: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  modalSaveButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categorySelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    gap: 6,
  },
  categorySelectorItemActive: {
    backgroundColor: Colors.light.primary,
  },
  categorySelectorText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  categorySelectorTextActive: {
    color: Colors.light.surface,
  },
  templateDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  templateDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  contentPreview: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentPreviewText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
});