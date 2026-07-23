import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Internal server error fetching templates' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ template });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return res.status(500).json({ error: 'Internal server error fetching template' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, structureJson } = req.body;

    if (!name || !structureJson) {
      return res.status(400).json({ error: 'Name and structure configurations are required' });
    }

    // Verify structureJson is valid JSON
    try {
      JSON.parse(typeof structureJson === 'string' ? structureJson : JSON.stringify(structureJson));
    } catch {
      return res.status(400).json({ error: 'Structure must be valid JSON' });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description: description || null,
        structureJson: typeof structureJson === 'string' ? structureJson : JSON.stringify(structureJson),
      },
    });

    return res.status(201).json({ message: 'Template saved successfully', template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return res.status(500).json({ error: 'Internal server error creating template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const { name, description, structureJson } = req.body;

    const existingTemplate = await prisma.template.findUnique({ where: { id } });
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (structureJson) {
      try {
        JSON.parse(typeof structureJson === 'string' ? structureJson : JSON.stringify(structureJson));
      } catch {
        return res.status(400).json({ error: 'Structure must be valid JSON' });
      }
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name: name ?? existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        structureJson: structureJson
          ? (typeof structureJson === 'string' ? structureJson : JSON.stringify(structureJson))
          : existingTemplate.structureJson,
      },
    });

    return res.json({ message: 'Template updated successfully', template: updatedTemplate });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return res.status(500).json({ error: 'Internal server error updating template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const existingTemplate = await prisma.template.findUnique({ where: { id } });
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.template.delete({ where: { id } });
    return res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Internal server error deleting template' });
  }
};
