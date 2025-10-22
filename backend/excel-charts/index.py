"""
Business: API для обработки Excel файлов и генерации графиков
Args: event - dict с httpMethod, body (base64 файл), queryStringParameters
      context - объект с request_id, function_name и другими атрибутами
Returns: JSON с данными графика или base64 изображением графика
"""

import json
import base64
import io
from typing import Dict, Any, List, Optional
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pydantic import BaseModel, Field


class ChartRequest(BaseModel):
    file_data: str = Field(..., description="Base64 encoded Excel file")
    chart_type: str = Field('line', pattern='^(line|bar|pie|scatter)$')
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    sheet_name: Optional[str] = None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'parse')
        
        if action == 'parse':
            return parse_excel(body_data)
        elif action == 'generate_chart':
            return generate_chart(body_data)
        elif action == 'statistics':
            return calculate_statistics(body_data)
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }


def parse_excel(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        file_data = data.get('file_data', '')
        sheet_name = data.get('sheet_name', 0)
        
        file_bytes = base64.b64decode(file_data)
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=sheet_name)
        
        columns = df.columns.tolist()
        rows = df.head(100).to_dict(orient='records')
        
        for row in rows:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
                elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                    row[key] = str(value)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'columns': columns,
                'data': rows,
                'total_rows': len(df)
            })
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def generate_chart(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        file_data = data.get('file_data', '')
        chart_type = data.get('chart_type', 'line')
        x_column = data.get('x_column')
        y_column = data.get('y_column')
        sheet_name = data.get('sheet_name', 0)
        
        file_bytes = base64.b64decode(file_data)
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=sheet_name)
        
        if not x_column or not y_column:
            columns = df.columns.tolist()
            x_column = x_column or columns[0]
            y_column = y_column or columns[1]
        
        plt.figure(figsize=(10, 6))
        plt.style.use('seaborn-v0_8-darkgrid')
        
        if chart_type == 'line':
            plt.plot(df[x_column], df[y_column], marker='o', linewidth=2, color='#2563EB')
            plt.xlabel(x_column, fontsize=12)
            plt.ylabel(y_column, fontsize=12)
            
        elif chart_type == 'bar':
            plt.bar(df[x_column], df[y_column], color='#2563EB', alpha=0.8)
            plt.xlabel(x_column, fontsize=12)
            plt.ylabel(y_column, fontsize=12)
            plt.xticks(rotation=45, ha='right')
            
        elif chart_type == 'pie':
            colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
            plt.pie(df[y_column], labels=df[x_column], autopct='%1.1f%%', colors=colors)
            
        elif chart_type == 'scatter':
            plt.scatter(df[x_column], df[y_column], alpha=0.6, s=100, color='#2563EB')
            plt.xlabel(x_column, fontsize=12)
            plt.ylabel(y_column, fontsize=12)
        
        plt.title(f'{y_column} по {x_column}', fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'image': image_base64,
                'format': 'png'
            })
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def calculate_statistics(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        file_data = data.get('file_data', '')
        column = data.get('column')
        sheet_name = data.get('sheet_name', 0)
        
        file_bytes = base64.b64decode(file_data)
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=sheet_name)
        
        if not column:
            column = df.select_dtypes(include=['number']).columns[0]
        
        numeric_data = pd.to_numeric(df[column], errors='coerce').dropna()
        
        stats = {
            'count': int(len(numeric_data)),
            'mean': float(numeric_data.mean()),
            'median': float(numeric_data.median()),
            'std': float(numeric_data.std()),
            'min': float(numeric_data.min()),
            'max': float(numeric_data.max()),
            'sum': float(numeric_data.sum()),
            'q25': float(numeric_data.quantile(0.25)),
            'q75': float(numeric_data.quantile(0.75))
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(stats)
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
