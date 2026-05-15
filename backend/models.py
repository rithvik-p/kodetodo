from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from typing import Optional

Base = declarative_base()

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(String)
    due_date = Column(DateTime)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = Column(String)
    dependencies = relationship("Task", secondary="task_dependencies", backref="dependent_tasks")
    related_tasks = relationship("Task", secondary="task_dependencies", backref="depending_tasks")

    def __repr__(self):
        return f"Task(title='{self.title}', due_date={self.due_date})"

class TaskDependencies(Base):
    __tablename__ = 'task_dependencies'
    
    task_id = Column(Integer, foreign key=Task.id, primary_key=True)
    dependent_task_id = Column(Integer, ForeignKey('tasks.id'))
    version = Column(String)

class TaskDependenciesConnection(Base):
    __tablename__ = 'task_dependencies_connection'
    
    task_id = Column(Integer, ForeignKey('tasks.id'), primary_key=True)
    dependent_task_id = Column(Integer, ForeignKey('tasks.id'))

# Example usage in setup
# conn = SQLAlchemy.connect(...)
# Base.metadata.create_all(bind=conn)