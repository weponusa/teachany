#!/usr/bin/env python3
"""
跨平台本地 TTS 生成器
支持 macOS (say) 和 Windows (pyttsx3)
"""
import json
import os
import platform
import subprocess
import sys
from pathlib import Path

# 自动安装依赖
def install_dependencies():
    """根据平台安装必要的依赖"""
    system = platform.system()
    
    if system == "Windows":
        try:
            import pyttsx3
        except ImportError:
            print("📦 Windows 平台：正在安装 pyttsx3...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyttsx3"])
            print("✅ pyttsx3 安装完成！")
    
    # macOS 不需要额外依赖（系统内置 say 命令）

# 执行安装
install_dependencies()

# Windows 平台导入
if platform.system() == "Windows":
    import pyttsx3

class CrossPlatformTTS:
    """跨平台 TTS 引擎"""
    
    def __init__(self):
        self.system = platform.system()
        
        if self.system == "Darwin":
            self.engine_type = "macOS_say"
            self._check_macos_voices()
        elif self.system == "Windows":
            self.engine_type = "Windows_SAPI"
            self._init_windows_tts()
        else:
            raise OSError(f"不支持的操作系统: {self.system}")
    
    def _check_macos_voices(self):
        """检查 macOS 可用语音"""
        try:
            result = subprocess.run(
                ["say", "-v", "?"],
                capture_output=True,
                text=True,
                check=True
            )
            voices = result.stdout
            
            # 检查推荐语音
            has_tingting = "Tingting" in voices
            has_meijia = "Meijia" in voices
            has_samantha = "Samantha" in voices
            
            print(f"✅ macOS say 命令可用")
            print(f"   中文语音: {'Tingting ✓' if has_tingting else 'Tingting ✗'} | {'Meijia ✓' if has_meijia else 'Meijia ✗'}")
            print(f"   英文语音: {'Samantha ✓' if has_samantha else 'Alex (系统默认)'}")
            
            if not has_tingting:
                print("\n⚠️  建议安装 Tingting 高质量中文语音：")
                print("   系统偏好设置 → 辅助功能 → 语音 → 系统语音 → 简体中文 - Tingting")
        
        except Exception as e:
            print(f"❌ 检查 macOS 语音失败: {e}")
            sys.exit(1)
    
    def _init_windows_tts(self):
        """初始化 Windows TTS 引擎"""
        try:
            self.engine = pyttsx3.init()
            
            # 获取可用语音
            voices = self.engine.getProperty('voices')
            
            # 查找中英文语音
            self.zh_voice = None
            self.en_voice = None
            
            for voice in voices:
                if 'chinese' in voice.name.lower() or 'zh' in voice.id.lower():
                    self.zh_voice = voice.id
                elif 'english' in voice.name.lower() or 'en-us' in voice.id.lower():
                    self.en_voice = voice.id
            
            # 设置默认参数
            self.engine.setProperty('rate', 180)  # 语速
            self.engine.setProperty('volume', 1.0)  # 音量
            
            print("✅ Windows SAPI 语音引擎已初始化")
            print(f"   中文语音: {self.zh_voice if self.zh_voice else '未找到'}")
            print(f"   英文语音: {self.en_voice if self.en_voice else voices[0].id}")
            
            if not self.zh_voice:
                print("\n⚠️  未检测到中文语音包，将使用系统默认语音")
                print("   建议安装 Microsoft 语音包（Windows 设置 → 时间和语言 → 语音）")
        
        except Exception as e:
            print(f"❌ 初始化 Windows TTS 失败: {e}")
            sys.exit(1)
    
    def generate_audio(self, text: str, output_path: str, language: str = "zh", rate: int = 180):
        """
        生成语音音频
        
        Args:
            text: 要合成的文本
            output_path: 输出音频路径
            language: 语言代码 ("zh" 或 "en")
            rate: 语速（macOS: 单词/分钟，Windows: 通用速度）
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if self.engine_type == "macOS_say":
            self._generate_macos(text, output_path, language, rate)
        elif self.engine_type == "Windows_SAPI":
            self._generate_windows(text, output_path, language, rate)
    
    def _generate_macos(self, text: str, output_path: Path, language: str, rate: int):
        """macOS 平台生成"""
        # 选择语音
        voice = "Tingting" if language == "zh" else "Samantha"
        
        # 临时 AIFF 文件
        temp_aiff = output_path.with_suffix('.aiff')
        
        try:
            # 使用 say 命令生成
            cmd = [
                "say",
                "-v", voice,
                "-r", str(rate),
                "-o", str(temp_aiff),
                text
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # 检查是否有 ffmpeg
            if self._has_ffmpeg():
                # 转换为 MP3
                ffmpeg_cmd = [
                    "ffmpeg",
                    "-i", str(temp_aiff),
                    "-acodec", "libmp3lame",
                    "-ab", "192k",
                    "-y",
                    str(output_path)
                ]
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True, stderr=subprocess.DEVNULL)
                temp_aiff.unlink()  # 删除临时文件
            else:
                # 无 ffmpeg，输出 AIFF
                temp_aiff.rename(output_path.with_suffix('.aiff'))
                print(f"⚠️  未安装 ffmpeg，输出为 AIFF 格式: {output_path.with_suffix('.aiff')}")
        
        except subprocess.CalledProcessError as e:
            print(f"❌ macOS say 命令失败: {e}")
            sys.exit(1)
    
    def _generate_windows(self, text: str, output_path: Path, language: str, rate: int):
        """Windows 平台生成"""
        try:
            # 选择语音
            if language == "zh" and self.zh_voice:
                self.engine.setProperty('voice', self.zh_voice)
            elif language == "en" and self.en_voice:
                self.engine.setProperty('voice', self.en_voice)
            
            # 设置语速
            self.engine.setProperty('rate', rate)
            
            # 生成音频
            self.engine.save_to_file(text, str(output_path))
            self.engine.runAndWait()
            
        except Exception as e:
            print(f"❌ Windows TTS 生成失败: {e}")
            sys.exit(1)
    
    def _has_ffmpeg(self) -> bool:
        """检查是否安装 ffmpeg"""
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False


def load_narration(language: str) -> list:
    """加载旁白脚本"""
    script_path = Path(f"scripts/narration_{language}.json")
    
    if not script_path.exists():
        print(f"❌ 未找到旁白脚本: {script_path}")
        sys.exit(1)
    
    with open(script_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="跨平台本地 TTS 生成器")
    parser.add_argument("language", choices=["zh", "en"], help="语言: zh (中文) 或 en (英文)")
    parser.add_argument("--rate", type=int, default=180, help="语速（默认: 180）")
    parser.add_argument("--overwrite", action="store_true", help="覆盖已存在的音频")
    parser.add_argument("--list-voices", action="store_true", help="列出系统可用语音")
    
    args = parser.parse_args()
    
    # 初始化 TTS 引擎
    tts = CrossPlatformTTS()
    
    # 列出语音
    if args.list_voices:
        if tts.engine_type == "macOS_say":
            subprocess.run(["say", "-v", "?"])
        elif tts.engine_type == "Windows_SAPI":
            voices = tts.engine.getProperty('voices')
            print("\n可用语音:")
            for voice in voices:
                print(f"  - {voice.name} ({voice.id})")
        return
    
    # 加载旁白脚本
    narration_data = load_narration(args.language)
    
    # 生成音频
    output_dir = Path("public/tts")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total = 0
    for episode in narration_data:
        episode_id = episode['episode']
        
        for segment in episode['segments']:
            seg_id = segment['id']
            text = segment['text']
            
            # 输出文件路径
            output_file = output_dir / f"{episode_id}_{seg_id}_{args.language}.mp3"
            
            # 检查是否已存在
            if output_file.exists() and not args.overwrite:
                print(f"⏭️  跳过: {output_file.name}（已存在）")
                continue
            
            # 生成音频
            print(f"🎙️  生成: {output_file.name}")
            tts.generate_audio(text, output_file, args.language, args.rate)
            total += 1
    
    print(f"\n✅ 完成！共生成 {total} 个音频文件")
    print(f"📂 输出目录: {output_dir.absolute()}")
    
    # 提示安装 ffmpeg（macOS）
    if tts.engine_type == "macOS_say" and not tts._has_ffmpeg():
        print("\n💡 提示：安装 ffmpeg 可输出 MP3 格式")
        print("   brew install ffmpeg")


if __name__ == "__main__":
    main()
